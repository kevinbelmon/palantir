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
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { campo, ultimoBloque } from "./lib/estado.mjs";

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

/**
 * Reparte las sesiones entre features segun lo que declara cada bloque
 * `## Implement`.
 *
 * El campo `session_ids` lo estampa /sdd-implement al cerrar: es el unico dato
 * que ningun script puede derivar, porque solo el agente que implemento sabe en
 * que sesion lo hizo. Con eso el reparto deja de ser inferencia y pasa a ser
 * aritmetica.
 *
 * Una sesion reclamada por MAS de una feature no se le imputa a ninguna. Pasa
 * cuando se trabajaron varias features en la misma sesion, y repartirla —en
 * partes iguales, por cantidad de tareas, por lo que sea— seria inventar. Se
 * reporta aparte, para que el total del proyecto siga cerrando y las cifras por
 * feature se puedan sumar sin contar dos veces.
 */
function atribuir(root, sesiones) {
  const dir = join(root, "metrics");
  if (!existsSync(dir)) return { features: {}, sinAtribuir: sesiones };

  // El id de cada feature sale del nombre de su archivo de metricas.
  const reclamos = new Map(); // sessionId -> [featureId]
  for (const archivo of readdirSync(dir).filter((f) => f.endsWith("-metrics.md"))) {
    const id = archivo.replace(/-metrics\.md$/, "");
    const bloque = ultimoBloque(readFileSync(join(dir, archivo), "utf8"), "Implement");
    if (!bloque) continue;
    const crudo = campo(bloque.body ?? bloque, "session_ids");
    if (!crudo) continue;
    for (const sid of crudo.replace(/[[\]]/g, "").split(",").map((x) => x.trim()).filter(Boolean)) {
      reclamos.set(sid, [...(reclamos.get(sid) ?? []), id]);
    }
  }

  const features = {};
  const sinAtribuir = [];
  for (const s of sesiones) {
    const duenos = reclamos.get(s.sessionId) ?? [];
    if (duenos.length !== 1) {
      sinAtribuir.push(s);
      continue;
    }
    const id = duenos[0];
    features[id] ??= {
      tokens: 0,
      desglose: { input: 0, output: 0, cache_creation: 0, cache_read: 0 },
      sessions: [],
    };
    features[id].tokens += Number(s.totalTokens) || 0;
    features[id].desglose.input += Number(s.inputTokens) || 0;
    features[id].desglose.output += Number(s.outputTokens) || 0;
    features[id].desglose.cache_creation += Number(s.cacheCreationTokens) || 0;
    features[id].desglose.cache_read += Number(s.cacheReadTokens) || 0;
    features[id].sessions.push(s.sessionId);
  }
  return { features, sinAtribuir };
}

const sumar = (k) => propias.reduce((a, s) => a + (Number(s[k]) || 0), 0);

const reparto = atribuir(DATA_ROOT, propias);

const salida = {
  schema_version: 1,
  generated: new Date().toISOString(),
  source: "ccusage",
  // El consumidor tiene que poder distinguir un total de proyecto de una suma de
  // features: no son la misma magnitud y no se pueden comparar entre si.
  alcance: "proyecto",
  sessions: propias.map((s) => s.sessionId),
  features: reparto.features,
  // Lo que no se pudo imputar a una sola feature. El total del proyecto lo
  // incluye; la suma por feature, no. Sin este campo no cerrarian las cuentas.
  sin_atribuir: {
    tokens: reparto.sinAtribuir.reduce((a, s) => a + (Number(s.totalTokens) || 0), 0),
    sessions: reparto.sinAtribuir.map((s) => s.sessionId),
  },
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
const atribuidas = Object.keys(reparto.features).length;
if (atribuidas) console.log(`      ${atribuidas} feature(s) con consumo atribuido`);
if (reparto.sinAtribuir.length) {
  console.log(`
WARN  ${reparto.sinAtribuir.length} sesion(es) sin atribuir: ${miles(salida.sin_atribuir.tokens)} tokens.`);
  console.log(`      Siguen en el total del proyecto. Una sesion se atribuye cuando UNA sola`);
  console.log(`      feature la declara en session_ids de su bloque ## Implement.`);
}
