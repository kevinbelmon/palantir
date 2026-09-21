/**
 * transporte-git — deja un conjunto de archivos en un repo git remoto.
 *
 * Es el "cómo se publica", sin saber "qué se publica". El estado del proyecto lo
 * usa para subir un JSON; mañana las specs lo van a usar para subir varios
 * markdown, y la única diferencia va a ser la lista de archivos y las dos
 * políticas que recibe como parámetro.
 *
 * Lo que resuelve, y por lo que vale la pena que viva en un solo lugar:
 * clonado superficial, destino en cualquiera de las cuatro formas que usa un
 * equipo real, guarda contra pisar lo ajeno, salteo cuando no cambió nada,
 * identidad del commit y reintento con rebase cuando dos repos publican a la vez.
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const git = (args, cwd) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/** Las rutas dentro del repo van con `/` aunque el host sea Windows. */
const aPosix = (p) => String(p).split("\\").join("/");

/**
 * URL de clonado a partir de lo que el usuario escribió.
 *
 * Se acepta lo que un equipo real usa, en cuatro formas:
 *
 *   URL completa      https://gitlab.com/grupo/sub/repo.git
 *   remoto SSH        git@gitlab.example.com:grupo/sub/repo.git
 *   ruta local        /tmp/central.git          (para probar sin tocar nada)
 *   atajo             org/repo  ·  gitlab.com/grupo/sub/repo
 *
 * El SSH se detecta ANTES que el atajo porque `git@github.com:org/repo.git`
 * también matchea esa forma —tiene una sola barra— y sin este orden se armaba
 * una URL https corrupta que fallaba con un mensaje que no señalaba la causa.
 *
 * El atajo admite **más de dos segmentos**: GitLab anida subgrupos y
 * `grupo/subgrupo/repo` es una ruta legítima. Exigir exactamente dos —como se
 * hacía— rechazaba cualquier repo de GitLab dentro de un subgrupo.
 *
 * Si el primer segmento tiene un punto se lo toma como host, así
 * `gitlab.com/grupo/repo` y `git.empresa.com/equipo/repo` funcionan sin flags.
 * Sin punto, el host es el de `SDD_GIT_HOST` o github.com.
 */
const ES_SSH = /^[^@\s]+@[^:\s]+:/;
const ES_ATAJO = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)+$/;

/**
 * Usuario con el que se inyecta el token en la URL. No es cosmético: cada host
 * espera el suyo y con el equivocado la autenticación falla con un 401 que no
 * dice por qué.
 */
function usuarioDelToken(host) {
  if (/(^|\.)gitlab\./.test(host) || host.startsWith("gitlab.")) return "oauth2";
  if (/(^|\.)bitbucket\./.test(host)) return "x-token-auth";
  return "x-access-token"; // github.com y compatibles
}

export function resolverDestino(destino, token = "") {
  if (!destino) return { error: "falta el repo de destino." };
  if (destino.includes("://") || ES_SSH.test(destino) || existsSync(destino)) {
    return { url: destino };
  }
  if (!ES_ATAJO.test(destino)) {
    return {
      error:
        `"${destino}" no parece un repo. Se espera org/repo, host/grupo/repo, ` +
        "una URL, un remoto SSH o una ruta local.",
    };
  }

  const porDefecto = process.env.SDD_GIT_HOST || "github.com";
  const partes = destino.split("/");

  // Un punto en el primer segmento sugiere un host, pero no lo prueba: una
  // organizacion puede llamarse `socket.io`. Se lo toma como host solo si lo que
  // queda sigue teniendo forma de <grupo>/<repo>; si no, era parte del nombre.
  // Asi `gitlab.com/grupo/repo` va a GitLab y `socket.io/mi-repo` va al host por
  // defecto, que es lo que cada uno quiso decir.
  const pareceHost = partes[0].includes(".") && partes.length > 2;
  const host = pareceHost ? partes.shift() : porDefecto;
  const ruta = partes.join("/");

  return {
    url: token
      ? `https://${usuarioDelToken(host)}:${token}@${host}/${ruta}.git`
      : `https://${host}/${ruta}.git`,
  };
}

/**
 * Publica archivos en un repo git.
 *
 * @param {object} opciones
 * @param {string}   opciones.destino     `org/repo`, URL, remoto SSH o ruta local.
 * @param {string}  [opciones.token]      Solo para CI; en una máquina se usa la credencial de git.
 * @param {Array<{origen: string, rutaDestino: string}>} opciones.archivos
 * @param {string}   opciones.mensaje     Mensaje del commit.
 * @param {function} [opciones.guarda]    `(textoPublicado, textoNuevo, rutaDestino) => string[] | null`
 *                                        Devuelve el motivo por el que NO hay que pisar ese archivo,
 *                                        o null si se puede. Solo se llama si el archivo ya existe.
 * @param {function} [opciones.equivalentes] `(rutaPublicada, rutaNueva) => boolean`
 *                                        ¿Cambió algo real? Si TODOS los archivos son equivalentes
 *                                        a lo publicado, no se commitea. Por defecto compara bytes.
 * @param {boolean} [opciones.dryRun]
 * @returns {{estado: "publicado"|"sin-cambios"|"dry-run"|"error", detalle?: string[]}}
 */
export function publicar({ destino, token = "", archivos, mensaje, guarda, equivalentes, rama = "", dryRun = false }) {
  const { url, error } = resolverDestino(destino, token);
  if (error) return { estado: "error", detalle: [error] };
  if (!archivos?.length) return { estado: "error", detalle: ["no hay archivos que publicar."] };

  const faltan = archivos.filter((a) => !existsSync(a.origen)).map((a) => a.origen);
  if (faltan.length) return { estado: "error", detalle: [`no existe: ${faltan.join(", ")}`] };

  const trabajo = mkdtempSync(join(tmpdir(), "sdd-central-"));

  try {
    try {
      // Con `rama` se publica ahi en vez de en la rama por defecto. Existe porque
      // la rama por defecto suele estar protegida —GitLab rechaza el push con
      // "pre-receive hook declined"— y un documento que se regenera solo no
      // amerita un merge request. Si la rama no existe en el remoto, se crea.
      git(["clone", "--depth", "1", ...(rama ? ["--branch", rama] : []), url, trabajo]);
    } catch (e) {
      if (rama) {
        try {
          git(["clone", "--depth", "1", url, trabajo]);
          git(["checkout", "-b", rama], trabajo);
        } catch (e2) {
          return { estado: "error", detalle: ["no se pudo clonar el repo de destino.", String(e2.stderr ?? e2.message).trim()] };
        }
      } else {
      return {
        estado: "error",
        detalle: [
          "no se pudo clonar el repo de destino.",
          String(e.stderr ?? e.message).trim().split("\n").slice(-2).join(" "),
          token
            ? "Revisá que el token tenga escritura sobre el destino."
            : "Sin token se usa la credencial de git de esta máquina.",
          'Si el repo es privado y dice "not found", casi siempre es falta de permiso:',
          "GitHub y GitLab responden 404 en vez de 403 para no revelar que existe.",
          "Pedí acceso de escritura, o publicá desde el CI con un token.",
        ],
      };
      }
    }

    // Guarda: nunca pisar lo que es de otro. Se consulta antes de copiar nada,
    // así un conjunto que toca varios archivos no queda a medio aplicar.
    if (guarda) {
      for (const { origen, rutaDestino } of archivos) {
        const enRepo = join(trabajo, rutaDestino);
        if (!existsSync(enRepo)) continue;
        const motivo = guarda(readFileSync(enRepo, "utf8"), readFileSync(origen, "utf8"), rutaDestino);
        if (motivo) return { estado: "error", detalle: motivo };
      }
    }

    // Pre-chequeo opcional, para equivalencias que git no puede ver: el estado
    // difiere en cada corrida solo por sus marcas de tiempo, y comparar el JSON
    // ignorandolas evita copiar para despues descartar.
    if (equivalentes) {
      const sinCambios = archivos.every(({ origen, rutaDestino }) => {
        const enRepo = join(trabajo, rutaDestino);
        return existsSync(enRepo) && equivalentes(enRepo, origen);
      });
      if (sinCambios) return { estado: "sin-cambios" };
    }

    for (const { origen, rutaDestino } of archivos) {
      const enRepo = join(trabajo, rutaDestino);
      mkdirSync(dirname(enRepo), { recursive: true });
      copyFileSync(origen, enRepo);
    }

    if (dryRun) return { estado: "dry-run" };

    // Identidad del commit: la del repo destino si ya la trae, si no la de la
    // máquina. No se fuerza una identidad de bot cuando publica una persona —
    // que el commit diga quién publicó es parte del valor del repo central.
    let tieneIdentidad = false;
    try {
      tieneIdentidad = git(["config", "user.email"], trabajo).trim().length > 0;
    } catch {
      tieneIdentidad = false;
    }
    if (!tieneIdentidad) {
      git(["config", "user.name", "sdd-estado"], trabajo);
      git(["config", "user.email", "sdd-estado@users.noreply.github.com"], trabajo);
    }

    for (const { rutaDestino } of archivos) git(["add", aPosix(rutaDestino)], trabajo);

    /**
     * Git es la autoridad sobre que cambio, no la comparacion de bytes.
     *
     * En Windows el checkout convierte los finales de linea a CRLF, asi que un
     * markdown identico se lee distinto byte a byte y el pre-chequeo decide
     * copiar. Git normaliza al indexar, no encuentra nada que commitear y
     * `git commit` sale 1 — antes eso reventaba el script con "nothing to
     * commit" en vez de reportar que no habia cambios.
     */
    if (!git(["status", "--porcelain"], trabajo).trim()) {
      return { estado: "sin-cambios" };
    }

    git(["commit", "-m", mensaje], trabajo);

    // Varios repos pueden publicar a la vez. Como cada uno escribe sus propios
    // archivos no hay conflicto de contenido, solo de índice, y el rebase lo
    // resuelve.
    for (let intento = 1; intento <= 3; intento++) {
      try {
        git(rama ? ["push", "-u", "origin", rama] : ["push"], trabajo);
        return { estado: "publicado" };
      } catch (e) {
        if (intento === 3) {
          return {
            estado: "error",
            detalle: [
              "no se pudo publicar después de 3 intentos.",
              String(e.stderr ?? e.message).trim().split("\n").slice(-2).join(" "),
            ],
          };
        }
        console.log(`WARN  push rechazado, reintento ${intento}`);
        git(["pull", "--rebase", "--autostash"], trabajo);
      }
    }
    return { estado: "error", detalle: ["el reintento de push terminó sin resolverse."] };
  } finally {
    rmSync(trabajo, { recursive: true, force: true });
  }
}
