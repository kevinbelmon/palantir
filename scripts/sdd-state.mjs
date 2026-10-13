#!/usr/bin/env node
/**
 * sdd-state — escribe el estado del DATA_ROOT como JSON.
 *
 * Es un proyector: lee y escribe. No valida, no bloquea, no sale a la red.
 * El veredicto sobre si el modelo es consistente lo da `sdd-audit`; esto solo
 * dice en qué estado está el trabajo.
 *
 * El documento resultante está pensado para publicarse fuera del repo —un
 * tablero central que junta varios codebases—, así que no contiene una sola
 * línea de spec, plan ni decisión: solo identificadores, estados y conteos.
 * Ver scripts/lib/estado.mjs.
 *
 * Uso:  node scripts/sdd-state.mjs                        escribe metrics/estado.json
 *       node scripts/sdd-state.mjs --root <path>          otro árbol
 *       node scripts/sdd-state.mjs --out <archivo>        otro destino
 *       node scripts/sdd-state.mjs --stdout               a la salida estándar
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { leerEstado, paraPublicar, avisos } from "./lib/estado.mjs";

const argv = process.argv.slice(2);
const flag = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};
const has = (n) => argv.includes(`--${n}`);

// Misma convención que sdd-audit: el árbol auditado nunca se deriva de dónde
// está este script. Ver contracts/paths.md §1.
const DATA_ROOT = flag("root") ? resolve(process.cwd(), flag("root")) : process.cwd();
const FRAMEWORK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const versionFramework = () => {
  const p = join(FRAMEWORK_ROOT, ".claude", "VERSION");
  return existsSync(p) ? readFileSync(p, "utf8").trim() : null;
};

const estado = leerEstado(DATA_ROOT, { framework: versionFramework() });

/**
 * Ruta bajo la que este codebase publica su estado: `<PRY-nnn>/<repo>.json`.
 *
 * Carpeta por proyecto y archivo por codebase, porque un proyecto puede tener
 * varios (contracts/paths.md §0: "un producto, N codebases").
 *
 * Se niega si falta cualquiera de los dos. Un archivo anónimo en un repo
 * compartido con el estado de varios clientes no se puede atribuir, no se puede
 * limpiar y no se puede actualizar sin adivinar a quién pisa. Mejor no publicar.
 */
if (has("publish-path")) {
  const { proyecto_id: pry, repo } = estado.source;
  const falta = [!pry && "meta.proyecto_id", !repo && "meta.repo"].filter(Boolean);
  if (falta.length) {
    console.error(`FAIL  no se puede publicar: falta ${falta.join(" y ")} en el registro.`);
    console.error(`      Se completan en specs/_registry/features.yaml, bloque meta.`);
    console.error(`      El proyecto_id lo escribe /sdd-generate cuando llega un brief de Discovery.`);
    process.exit(1);
  }
  // El nombre del repo puede venir como `org/nombre`: solo interesa la hoja, y
  // se sanea porque termina siendo un nombre de archivo.
  const hoja = String(repo).split("/").pop().replace(/[^A-Za-z0-9._-]/g, "-");
  process.stdout.write(`${pry}/${hoja}.json\n`);
  process.exit(0);
}
// Lo que se escribe es la versión publicable: sin rutas de archivo, porque este
// documento sale del repo. Ver paraPublicar() en lib/estado.mjs.
const json = JSON.stringify(paraPublicar(estado), null, 2) + "\n";

if (has("stdout")) {
  process.stdout.write(json);
  process.exit(0);
}

const salida = flag("out")
  ? resolve(process.cwd(), flag("out"))
  : join(DATA_ROOT, "metrics", "estado.json");

try {
  mkdirSync(dirname(salida), { recursive: true });
  writeFileSync(salida, json, "utf8");
} catch (err) {
  console.error(`FAIL  no se pudo escribir "${salida}".`);
  console.error(`      ${err.message}`);
  console.error(`      Si la carpeta está sincronizando, esperá unos segundos y reintentá.`);
  process.exit(1);
}

const r = estado.resumen;
console.log(`sdd-state · root: ${DATA_ROOT}`);
console.log(`            framework: ${estado.framework ?? "sin declarar"}`);
console.log(
  `            proyecto: ${estado.source.proyecto_id ?? "—"} · codebase: ${estado.source.repo ?? "—"}`
);
console.log(
  `\nPASS  ${r.features} feature(s) · OPEN ${r.open} · CLOSED ${r.closed} · BLOCKED ${r.blocked}` +
    (r.closed_sin_verificar ? ` · CLOSED sin verificar ${r.closed_sin_verificar}` : "") +
    ` · tareas ${r.tareas.hechas}/${r.tareas.total}`
);
console.log(`      ${salida}`);

const notas = avisos(estado);
if (notas.length) {
  console.log("");
  for (const n of notas) console.log(`WARN  ${n}`);
}
