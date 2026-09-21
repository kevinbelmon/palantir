#!/usr/bin/env node
/**
 * sdd-publish — genera el estado del DATA_ROOT y lo publica en el repo central.
 *
 * Este script decide QUÉ se publica; `lib/transporte-git.mjs` resuelve CÓMO.
 * La separación existe porque el transporte es lo reutilizable: subir specs a
 * otro repo, o el mismo documento a otro destino, cambia la lista de archivos y
 * las políticas, no el mecanismo.
 *
 * Hace tres cosas, en este orden:
 *   1. Corre el auditor con --json, para que el veredicto describa ESTE árbol.
 *   2. Mide el consumo real con ccusage (metrics/tokens.json).
 *   3. Corre sdd-state, que escribe metrics/estado.json, y lo publica.
 *
 * Uso:  node scripts/sdd-publish.mjs --central <org/repo>
 *       node scripts/sdd-publish.mjs --central <org/repo> --dry-run
 *       node scripts/sdd-publish.mjs --root <path> --central <org/repo>
 *
 * El central se puede pasar como `org/repo`, como URL completa, como remoto SSH
 * o como ruta local a un repo git. La ruta local existe para poder probar el
 * mecanismo entero sin tocar el central de verdad.
 *
 * Credenciales: sin --token usa la credencial de git que ya tenga la máquina, que
 * es lo correcto para un desarrollador publicando su propio proyecto. --token (o
 * SDD_ESTADO_TOKEN) existe para el CI, donde no hay credencial ambiente. Un token
 * con escritura al central repartido en N máquinas es lo que NO hay que hacer:
 * ver contracts/distribucion.md y el comentario del job en sdd-audit.yml.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { publicar } from "./lib/transporte-git.mjs";
import { publicar as publicarHttp } from "./lib/transporte-http.mjs";

const argv = process.argv.slice(2);
const flag = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};
const has = (n) => argv.includes(`--${n}`);

// Misma convención que sdd-audit y sdd-state: el árbol publicado nunca se deriva
// de dónde está este script. Ver contracts/paths.md §1.
const DATA_ROOT = flag("root") ? resolve(process.cwd(), flag("root")) : process.cwd();
const FRAMEWORK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const CENTRAL = flag("central") ?? process.env.SDD_ESTADO_REPO ?? "";
// Endpoint HTTP. Se declara aparte del repo git a proposito: una URL no dice
// por si sola si es de clonado o de API, y adivinarlo falla en silencio.
const ENDPOINT = flag("endpoint") ?? process.env.SDD_ESTADO_ENDPOINT ?? "";
// Solo del ambiente: un token por linea de comandos queda en el historial del
// shell y en la lista de procesos de la maquina. En CI sale de un secret.
const TOKEN = process.env.SDD_ESTADO_TOKEN ?? "";
// Rama del destino. Sin esto se publica en la de por defecto, que suele estar
// protegida: GitLab rechaza el push con "pre-receive hook declined".
const RAMA = flag("rama") ?? process.env.SDD_ESTADO_RAMA ?? "";

const fatal = (msg, ...detalle) => {
  console.error(`FAIL  ${msg}`);
  for (const d of detalle) console.error(`      ${d}`);
  process.exit(1);
};

if (!CENTRAL && !ENDPOINT) {
  fatal(
    "falta el repo central.",
    "Pasalo con --central <org/repo> o en la variable SDD_ESTADO_REPO.",
    "Es el repositorio compartido donde cada codebase publica su estado.",
  );
}

/** Corre un script del framework contra DATA_ROOT y devuelve su stdout. */
function correrScript(nombre, args = [], { tolerarFallo = false } = {}) {
  const r = spawnSync(process.execPath, [join(FRAMEWORK_ROOT, "scripts", nombre), "--root", DATA_ROOT, ...args], {
    encoding: "utf8",
  });
  if (r.error) fatal(`no se pudo ejecutar ${nombre}: ${r.error.message}`);
  if (r.status !== 0 && !tolerarFallo) {
    process.stderr.write(r.stderr ?? "");
    fatal(`${nombre} falló con código ${r.status}.`);
  }
  return r.stdout ?? "";
}

/**
 * Dos documentos son "el mismo estado" si solo difieren en marcas de tiempo.
 *
 * Se ignoran `generated` y `audit.generated`. El segundo importa desde que el
 * auditor corre en cada publicación: sin ignorarlo, el veredicto trae una fecha
 * nueva siempre, la comparación nunca coincide y el central junta un commit por
 * corrida aunque el proyecto no se haya movido.
 */
function mismoEstado(rutaPublicada, rutaNueva) {
  const sinFechas = (p) => {
    const o = JSON.parse(readFileSync(p, "utf8"));
    delete o.generated;
    if (o.audit && typeof o.audit === "object") delete o.audit.generated;
    return JSON.stringify(o);
  };
  try {
    return sinFechas(rutaPublicada) === sinFechas(rutaNueva);
  } catch {
    return false;
  }
}

/**
 * Guarda de identidad: nunca pisar el estado de otro.
 *
 * La ruta se arma con `meta.repo` y `meta.proyecto_id`. Si dos codebases
 * declaran la misma identidad —por copiar un registro, por un nombre genérico,
 * por un contador de proyecto que arranca en 1 en todos— el segundo en publicar
 * borraba el estado del primero sin que nadie se enterara: el archivo cambiaba
 * de contenido y el tablero mostraba un proyecto donde antes había otro.
 *
 * Se compara contra lo que el archivo dice de sí mismo, no contra la ruta: la
 * ruta ya coincide, eso es exactamente el problema.
 */
function esDeOtro(textoPublicado, textoNuevo) {
  let previo, mio;
  try {
    previo = JSON.parse(textoPublicado)?.source ?? {};
    mio = JSON.parse(textoNuevo)?.source ?? {};
  } catch {
    return null; // Un archivo ilegible no bloquea: se reescribe con uno válido.
  }
  const choca =
    (previo.repo && previo.repo !== mio.repo) ||
    (previo.proyecto_id && previo.proyecto_id !== mio.proyecto_id);
  if (!choca) return null;
  return [
    "ese archivo es de otro codebase — no se pisa.",
    `publicado:  repo "${previo.repo}" - proyecto "${previo.proyecto_id}"`,
    `este repo:  repo "${mio.repo}" - proyecto "${mio.proyecto_id}"`,
    "",
    "Dos codebases declararon la misma identidad y comparten ruta. Corregí",
    "meta.repo o meta.proyecto_id en specs/_registry/features.yaml -el que",
    "esté mal- antes de volver a publicar. No lo decidas solo: uno de los",
    "dos ya está publicando ahí.",
  ];
}

// ---------- qué se publica ----------
console.log(`sdd-publish · root:    ${DATA_ROOT}`);
console.log(`             destino: ${ENDPOINT ? ENDPOINT + " [endpoint]" : CENTRAL + " [repo git]"}`);

// El auditor sale 1 cuando hay FAIL y eso NO puede frenar la publicación: un repo
// en rojo es justo el que el tablero necesita ver.
correrScript("sdd-audit.mjs", ["--json"], { tolerarFallo: true });

// Mide el consumo real con ccusage y lo deja en metrics/tokens.json, que
// sdd-state transporta. Tolera fallo a propósito: no poder medir el esfuerzo no
// es motivo para que el proyecto deje de reportar su estado.
correrScript("sdd-tokens.mjs", [], { tolerarFallo: true });

correrScript("sdd-state.mjs");

// El script se niega si al registro le falta identidad: un archivo anónimo en un
// repo compartido no se puede atribuir ni limpiar.
const ruta = correrScript("sdd-state.mjs", ["--publish-path"]).trim();
if (!ruta) fatal("sdd-state no devolvió una ruta de publicación.");

const origen = join(DATA_ROOT, "metrics", "estado.json");
if (!existsSync(origen)) fatal(`no se generó ${origen}.`);

console.log(`             archivo: estado/${ruta}`);

// ---------- cómo se publica ----------
const origenRepo = process.env.GITHUB_REPOSITORY ?? "local";
const sha = (process.env.GITHUB_SHA ?? "").slice(0, 7);

const r = ENDPOINT
  ? await publicarHttp({
      destino: ENDPOINT,
      archivo: origen,
      token: TOKEN,
      rutaDestino: join("estado", ruta),
      dryRun: has("dry-run"),
    })
  : publicar({
      destino: CENTRAL,
      token: TOKEN,
      archivos: [{ origen, rutaDestino: join("estado", ruta) }],
      mensaje: `estado: ${ruta} desde ${origenRepo}${sha ? `@${sha}` : ""}`,
      guarda: esDeOtro,
      equivalentes: mismoEstado,
      rama: RAMA,
      dryRun: has("dry-run"),
    });

switch (r.estado) {
  case "error":
    fatal(r.detalle[0], ...r.detalle.slice(1));
    break;
  case "sin-cambios":
    console.log(`\nPASS  el estado no cambió — no se commitea.`);
    break;
  case "dry-run":
    console.log(`\nPASS  --dry-run: el archivo se habría publicado en estado/${ruta}.`);
    break;
  case "publicado":
    console.log(`\nPASS  publicado en estado/${ruta}`);
    break;
}
