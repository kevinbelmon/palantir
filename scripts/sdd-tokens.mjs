#!/usr/bin/env node
/**
 * sdd-tokens — mide el consumo real de tokens del proyecto y lo deja en
 * metrics/tokens.json, para que `sdd-state` lo transporte al documento.
 *
 * Existe porque `/sdd-metrics` es un comando de agente: un `.md` con
 * instrucciones que necesita un modelo para ejecutarse. Un pipeline determinista
 * no puede correrlo. Pero la parte que produce el unico numero *medido* de todo
 * el reporte —el token budget— es una llamada a ccusage, que si es un CLI. Eso
 * es lo que hace este script, sin agente y sin tokens.
 *
 * ALCANCE: proyecto, no feature. ccusage reporta por sesion de Claude Code, y
 * atribuir una sesion a una feature necesita el mapeo que escribe el hook en
 * `metrics/sessions.jsonl`. Sin ese archivo no hay forma honesta de repartir el
 * total entre features, asi que se publica el total del proyecto y se declara su
 * alcance. Repartirlo por cantidad de tareas seria inventar.
 *
 * Uso:  node scripts/sdd-tokens.mjs [--root <path>] [--stdout]
 *
 * No falla nunca el pipeline: si ccusage no esta, no hay red o el proyecto no
 * tiene sesiones registradas, avisa y sale 0. Medir el esfuerzo es deseable;
 * impedir que el estado se publique porque no se pudo medir, no.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const argv = process.argv.slice(2);
const flag = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};
const has = (n) => argv.includes(`--${n}`);

const DATA_ROOT = flag("root") ? resolve(process.cwd(), flag("root")) : process.cwd();

/**
 * ccusage guarda el proyecto como un slug: reemplaza todo lo que no sea
 * alfanumerico, guion bajo o guion por un guion. `C:\\Users\\PatricioMillán\\...`
 * queda `C--Users-PatricioMill-n-...`. Se deriva el slug esperado en vez de
 * comparar por nombre de carpeta: dos repos distintos pueden llamarse igual y
 * atribuirle a uno las sesiones del otro es peor que no medir.
 */
const slug = (p) => p.replace(/[^A-Za-z0-9_-]/g, "-").toLowerCase();

const aviso = (msg) => {
  console.log(`WARN  ${msg}`);
  console.log(`      El estado se publica igual, con el esfuerzo en SIN_DATO.`);
  process.exit(0);
};

/**
 * En Windows `npx` es un `.cmd`, y desde la correccion de CVE-2024-27980 Node se
 * niega a spawnearlo sin shell: devuelve EINVAL. La salida no es `shell: true`
 * —eso concatena los argumentos en vez de escaparlos y Node lo marca como
 * deprecado— sino invocar el `npx-cli.js` con el propio ejecutable de Node, que
 * no pasa por ningun interprete de comandos.
 */
const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
const argumentos = ["--yes", "ccusage@latest", "claude", "session", "--no-cost", "--json"];

const r = existsSync(npxCli)
  ? spawnSync(process.execPath, [npxCli, ...argumentos], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  : spawnSync("npx", argumentos, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

if (r.error || r.status !== 0) {
  aviso(`no se pudo ejecutar ccusage: ${r.error?.message ?? `codigo ${r.status}`}`);
}

let datos;
try {
  datos = JSON.parse(r.stdout);
} catch {
  aviso("ccusage no devolvio JSON valido.");
}

// NO se usa el bloque `totals` del JSON: agrega todas las sesiones de la maquina,
// de cualquier proyecto. Se filtra por el slug de ESTE arbol.
const esperado = slug(DATA_ROOT);
const propias = (datos.sessions ?? []).filter((s) => slug(String(s.projectPath ?? "")) === esperado);

if (!propias.length) {
  aviso(`ccusage no tiene sesiones para ${DATA_ROOT}.`);
}

const sumar = (campo) => propias.reduce((a, s) => a + (Number(s[campo]) || 0), 0);

const salida = {
  schema_version: 1,
  generated: new Date().toISOString(),
  source: "ccusage",
  // El consumidor tiene que poder distinguir un total de proyecto de una suma de
  // features: no son la misma magnitud y no se pueden comparar entre si.
  alcance: "proyecto",
  sessions: propias.map((s) => s.sessionId),
  tokens: {
    input: sumar("inputTokens"),
    output: sumar("outputTokens"),
    cache_creation: sumar("cacheCreationTokens"),
    cache_read: sumar("cacheReadTokens"),
    total: sumar("totalTokens"),
  },
};

if (has("stdout")) {
  process.stdout.write(JSON.stringify(salida, null, 2) + "\n");
  process.exit(0);
}

const destino = join(DATA_ROOT, "metrics", "tokens.json");
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, JSON.stringify(salida, null, 2) + "\n", "utf8");

const miles = (n) => n.toLocaleString("es-AR");
console.log(`sdd-tokens · root: ${DATA_ROOT}`);
console.log(`\nPASS  ${propias.length} sesion(es) · ${miles(salida.tokens.total)} tokens`);
console.log(`      ${destino}`);
if (!existsSync(join(DATA_ROOT, "metrics", "sessions.jsonl"))) {
  console.log(`\nWARN  sin metrics/sessions.jsonl — el total es del proyecto, no por feature.`);
  console.log(`      El hook de sesion lo escribe; sin el no hay como atribuir sesiones a features.`);
}
