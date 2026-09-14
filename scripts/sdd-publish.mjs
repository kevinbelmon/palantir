#!/usr/bin/env node
/**
 * sdd-publish — genera el estado del DATA_ROOT y lo publica en el repo central.
 *
 * Es el único lugar donde vive la lógica de publicación. El workflow de CI llama
 * a este script en vez de repetirla en bash: cuando la misma lógica se escribe
 * dos veces, las dos copias se separan y nadie se entera hasta que el tablero
 * muestra algo distinto de lo que el repo dice.
 *
 * Hace tres cosas, en este orden:
 *   1. Corre el auditor con --json, para que el veredicto describa ESTE árbol.
 *   2. Corre sdd-state, que escribe metrics/estado.json.
 *   3. Clona el central, copia el archivo bajo estado/<PRY-nnn>/<repo>.json,
 *      commitea solo si cambió algo real y pushea.
 *
 * Uso:  node scripts/sdd-publish.mjs --central <org/repo>
 *       node scripts/sdd-publish.mjs --central <org/repo> --dry-run
 *       node scripts/sdd-publish.mjs --root <path> --central <org/repo>
 *
 * El central se puede pasar como `org/repo`, como URL completa o como ruta local
 * a un repo git. La ruta local existe para poder probar el mecanismo entero sin
 * tocar el central de verdad.
 *
 * Credenciales: sin --token usa la credencial de git que ya tenga la máquina, que
 * es lo correcto para un desarrollador publicando su propio proyecto. --token (o
 * SDD_ESTADO_TOKEN) existe para el CI, donde no hay credencial ambiente. Un token
 * con escritura al central repartido en N máquinas es lo que NO hay que hacer:
 * ver contracts/distribucion.md y el comentario del job en sdd-audit.yml.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
const DRY = has("dry-run");

const CENTRAL = flag("central") ?? process.env.SDD_ESTADO_REPO ?? "";
const TOKEN = flag("token") ?? process.env.SDD_ESTADO_TOKEN ?? "";

const fatal = (msg, ...detalle) => {
  console.error(`FAIL  ${msg}`);
  for (const d of detalle) console.error(`      ${d}`);
  process.exit(1);
};

if (!CENTRAL) {
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

const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/**
 * Dos documentos son "el mismo estado" si solo difieren en marcas de tiempo.
 *
 * Se ignoran `generated` y `audit.generated`. El segundo importa desde que el
 * auditor corre en cada publicación: sin ignorarlo, el veredicto trae una fecha
 * nueva siempre, la comparación nunca coincide y el central junta un commit por
 * corrida aunque el proyecto no se haya movido.
 */
function mismoEstado(rutaA, rutaB) {
  const sinFechas = (p) => {
    const o = JSON.parse(readFileSync(p, "utf8"));
    delete o.generated;
    if (o.audit && typeof o.audit === "object") delete o.audit.generated;
    return JSON.stringify(o);
  };
  try {
    return sinFechas(rutaA) === sinFechas(rutaB);
  } catch {
    return false;
  }
}

/**
 * URL de clonado.
 *
 * Se acepta lo que un equipo real usa: `org/repo`, una URL completa, un remoto
 * SSH (`git@host:org/repo.git`) o una ruta local. El SSH se detecta antes que el
 * atajo `org/repo` porque `git@github.com:org/repo.git` también matchea esa forma
 * —tiene una sola barra— y sin este orden se armaba una URL https corrupta que
 * fallaba con un mensaje que no señalaba la causa.
 */
const ES_SSH = /^[^@\s]+@[^:\s]+:/;

function urlDelCentral() {
  if (CENTRAL.includes("://") || ES_SSH.test(CENTRAL) || existsSync(CENTRAL)) return CENTRAL;
  if (!/^[^/]+\/[^/]+$/.test(CENTRAL)) {
    fatal(`"${CENTRAL}" no parece un repo.`, "Se espera org/repo, una URL, un remoto SSH o una ruta local.");
  }
  return TOKEN
    ? `https://x-access-token:${TOKEN}@github.com/${CENTRAL}.git`
    : `https://github.com/${CENTRAL}.git`;
}

// ---------- 1 y 2: veredicto fresco + documento ----------
console.log(`sdd-publish · root:    ${DATA_ROOT}`);
console.log(`             central: ${CENTRAL}`);

// El auditor sale 1 cuando hay FAIL y eso NO puede frenar la publicación: un repo
// en rojo es justo el que el tablero necesita ver.
correrScript("sdd-audit.mjs", ["--json"], { tolerarFallo: true });
correrScript("sdd-state.mjs");

// El script se niega si al registro le falta identidad: un archivo anónimo en un
// repo compartido no se puede atribuir ni limpiar.
const ruta = correrScript("sdd-state.mjs", ["--publish-path"]).trim();
if (!ruta) fatal("sdd-state no devolvió una ruta de publicación.");

const origen = join(DATA_ROOT, "metrics", "estado.json");
if (!existsSync(origen)) fatal(`no se generó ${origen}.`);

console.log(`             archivo: estado/${ruta}`);

// ---------- 3: publicar ----------
const trabajo = mkdtempSync(join(tmpdir(), "sdd-central-"));
try {
  try {
    git(["clone", "--depth", "1", urlDelCentral(), trabajo]);
  } catch (e) {
    fatal(
      "no se pudo clonar el repo central.",
      String(e.stderr ?? e.message).trim().split("\n").slice(-2).join(" "),
      TOKEN
        ? "Revisá que el token tenga escritura sobre el central."
        : "Sin --token se usa la credencial de git de esta máquina.",
      "Si el central es privado y dice \"not found\", casi siempre es falta de permiso:",
      "GitHub responde 404 en vez de 403 para no revelar que el repo existe.",
      "Pedí acceso de escritura al central, o publicá desde el CI con SDD_ESTADO_TOKEN.",
    );
  }

  const destino = join(trabajo, "estado", ruta);
  mkdirSync(dirname(destino), { recursive: true });

  if (existsSync(destino) && mismoEstado(destino, origen)) {
    console.log(`\nPASS  el estado no cambió — no se commitea.`);
    process.exit(0);
  }

  copyFileSync(origen, destino);

  if (DRY) {
    console.log(`\nPASS  --dry-run: el archivo se habría publicado en estado/${ruta}.`);
    process.exit(0);
  }

  // Identidad: la del repo central si ya la trae, si no la de la máquina. No se
  // fuerza una identidad de bot cuando publica una persona — que el commit diga
  // quién publicó es parte del valor del central.
  const tieneIdentidad = () => {
    try {
      return git(["config", "user.email"], trabajo).trim().length > 0;
    } catch {
      return false;
    }
  };
  if (!tieneIdentidad()) {
    git(["config", "user.name", "sdd-estado"], trabajo);
    git(["config", "user.email", "sdd-estado@users.noreply.github.com"], trabajo);
  }

  const origenRepo = process.env.GITHUB_REPOSITORY ?? "local";
  const sha = (process.env.GITHUB_SHA ?? "").slice(0, 7);
  git(["add", `estado/${ruta}`.split("\\").join("/")], trabajo);
  git(["commit", "-m", `estado: ${ruta} desde ${origenRepo}${sha ? `@${sha}` : ""}`], trabajo);

  // Varios repos pueden publicar a la vez. Como cada uno escribe su propio archivo
  // no hay conflicto de contenido, solo de índice, y el rebase lo resuelve.
  for (let intento = 1; intento <= 3; intento++) {
    try {
      git(["push"], trabajo);
      console.log(`\nPASS  publicado en estado/${ruta}`);
      process.exit(0);
    } catch (e) {
      if (intento === 3) {
        fatal("no se pudo publicar después de 3 intentos.", String(e.stderr ?? e.message).trim().split("\n").slice(-2).join(" "));
      }
      console.log(`WARN  push rechazado, reintento ${intento}`);
      git(["pull", "--rebase", "--autostash"], trabajo);
    }
  }
} finally {
  rmSync(trabajo, { recursive: true, force: true });
}
