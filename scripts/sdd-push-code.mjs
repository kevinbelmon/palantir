#!/usr/bin/env node
/**
 * sdd-push-code — empuja el código de la feature activa a una rama `sdd/<feature-id>`
 * y te da el link para abrir el MR. Después para: el merge a la rama protegida es humano.
 *
 * MANUAL por diseño: nunca lo dispara /sdd-review ni sdd-publish. Separa el push de
 * CÓDIGO (esto) de la publicación de TELEMETRÍA (sdd-publish): son dos cosas con
 * destinos, permisos y riesgos distintos, y mezclarlas fue siempre un error.
 *
 * Determinista y sin red más allá de git. No mergea, no hace `--force`, nunca empuja
 * a la rama por defecto ni a una protegida.
 *
 * Uso:  pnpm push:code
 *       node scripts/sdd-push-code.mjs --root <path>        otro DATA_ROOT
 *       node scripts/sdd-push-code.mjs --feature <id>       elegir la feature a mano
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import YAML from "yaml";
import { parseGitRemote } from "./lib/estado.mjs";

const argv = process.argv.slice(2);
const flag = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};
const ROOT = flag("root") ? resolve(process.cwd(), flag("root")) : process.cwd();

const fatal = (msg, ...detalle) => {
  console.error(`FAIL  ${msg}`);
  for (const d of detalle) console.error(`      ${d}`);
  process.exit(1);
};
const git = (args, opts = {}) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });

// Nunca se empuja código a estas, aunque alguien fuerce el nombre de la feature.
const PROTEGIDAS = new Set(["main", "master", "develop", "trunk", "release", "HEAD"]);

// ---------- 1. feature-id activo ----------
function featureActivo() {
  const p = join(ROOT, "specs", "_registry", "features.yaml");
  if (!existsSync(p)) fatal("no existe specs/_registry/features.yaml — ¿este root es un DATA_ROOT?");
  let reg;
  try {
    reg = YAML.parse(readFileSync(p, "utf8")) ?? {};
  } catch (e) {
    fatal(`specs/_registry/features.yaml no es YAML válido — ${e.message}`);
  }
  const features = reg.features ?? [];

  const pedido = flag("feature");
  if (pedido) {
    if (!features.some((f) => f.id === pedido)) fatal(`la feature "${pedido}" no está en el registro.`);
    return pedido;
  }
  const abiertas = features.filter((f) => f.status === "OPEN");
  if (abiertas.length === 1) return abiertas[0].id;
  if (abiertas.length === 0) fatal("no hay features OPEN en el registro.", "Elegí una con --feature <id>.");
  fatal(
    `hay ${abiertas.length} features OPEN y no se puede adivinar cuál pushear:`,
    abiertas.map((f) => f.id).join(", "),
    "Elegí una con --feature <id>."
  );
}

const feature = featureActivo();
const rama = `sdd/${feature}`;
if (PROTEGIDAS.has(rama) || PROTEGIDAS.has(feature)) {
  fatal(`"${rama}" cae sobre una rama protegida — no se pushea código ahí.`);
}

// ---------- 2. remote origin ----------
let origin;
try {
  origin = git(["remote", "get-url", "origin"]).trim();
} catch {
  fatal("no hay remote `origin` configurado en este repo.", "Agregá uno antes de pushear código.");
}

// ---------- 3. crear la rama (si falta) y pushearla ----------
// La rama se crea desde HEAD sin checkout: no se toca el working tree del dev.
const existeLocal = (() => {
  try {
    git(["rev-parse", "--verify", `refs/heads/${rama}`]);
    return true;
  } catch {
    return false;
  }
})();
if (!existeLocal) {
  try {
    git(["branch", rama, "HEAD"]);
  } catch (e) {
    fatal(`no se pudo crear la rama ${rama}.`, String(e.stderr ?? e.message).trim());
  }
}

console.log(`sdd-push-code · feature: ${feature}`);
console.log(`               rama:    ${rama}`);
console.log(`               origin:  ${origin}\n`);

let salida;
try {
  salida = git(["push", "-u", "origin", rama]);
} catch (e) {
  const err = String(e.stderr ?? e.message).trim().split("\n").slice(-3).join(" ");
  fatal("git push falló.", err, "Sin --force y sin auto-merge: resolvé el rechazo a mano.");
}
if (salida.trim()) console.log(salida.trim());

// ---------- 4. link del MR ----------
const g = parseGitRemote(origin);
if (g) {
  const enc = encodeURIComponent(rama);
  const esGitLab = /gitlab/i.test(g.host);
  const url = esGitLab
    ? `https://${g.host}/${g.path}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${enc}`
    : `https://${g.host}/${g.path}/compare/${enc}?expand=1`;
  console.log(`\nPASS  código en ${rama}`);
  console.log(`      Abrí el MR:  ${url}`);
} else {
  console.log(`\nPASS  código en ${rama}`);
  console.log(`      (no pude construir el link del MR desde "${origin}" — abrilo a mano)`);
}

// ---------- 5. parar ----------
console.log(`      El merge a la rama protegida es humano: sin auto-merge, sin --force.`);
