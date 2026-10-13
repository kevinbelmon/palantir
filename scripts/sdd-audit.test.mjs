// Tests de integración del auditor — corren el CLI contra fixtures temporales y
// verifican el VEREDICTO (exit code + líneas del reporte), no la implementación.
//   node --test scripts/sdd-audit.test.mjs
//
// Hoy cubre CHECK 8 (versión e integridad de marcadores), que vive inline en el
// monolito y no se puede testear como función. Cuando llegue el kernel (checks.mjs
// como funciones puras), estos casos pasan a ser tests unitarios y esto queda como
// golden del CLI. Como la suite de distribución, no se materializa en consumidores.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AUDIT = resolve(dirname(fileURLToPath(import.meta.url)), "sdd-audit.mjs");
const BEGIN = "<!-- SDD:FRAMEWORK BEGIN v1 -->";
const END = "<!-- SDD:FRAMEWORK END -->";

/** Crea un root con layout SDD mínimo y los archivos que pida el caso. */
function root({ version = "1.0.0", skills = "1.0.0", claude = `${BEGIN}\nx\n${END}\n` } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sdd-audit-test-"));
  for (const d of ["specs", "metrics", "graph", ".claude/skills"]) mkdirSync(join(dir, d), { recursive: true });
  if (version !== null) writeFileSync(join(dir, ".claude/VERSION"), version);
  if (skills !== null) writeFileSync(join(dir, ".claude/skills/VERSION"), skills);
  if (claude !== null) writeFileSync(join(dir, "CLAUDE.md"), claude);
  return dir;
}

function run(dir) {
  const r = spawnSync(process.execPath, [AUDIT, "--root", dir], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

const cleanup = [];
test.after(() => cleanup.forEach((d) => rmSync(d, { recursive: true, force: true })));
const mk = (o) => { const d = root(o); cleanup.push(d); return d; };

test("CHECK 8: VERSION y skills/VERSION coherentes → pasa", () => {
  const { code, out } = run(mk({ version: "1.2.0", skills: "1.2.0" }));
  assert.equal(code, 0);
  assert.match(out, /versión del framework coherente/);
});

test("CHECK 8: VERSION ≠ skills/VERSION → FAIL (instalación partida)", () => {
  const { code, out } = run(mk({ version: "1.2.0", skills: "1.1.0" }));
  assert.equal(code, 1);
  assert.match(out, /instalación partida/);
});

test("CHECK 8: marcadores SDD:FRAMEWORK duplicados → FAIL", () => {
  const claude = `${BEGIN}\nx\n${BEGIN}\ny\n${END}\n`;
  const { code, out } = run(mk({ claude }));
  assert.equal(code, 1);
  assert.match(out, /mal formados/);
});

test("CHECK 8: END antes que BEGIN → FAIL", () => {
  const claude = `${END}\nx\n${BEGIN}\n`;
  const { code, out } = run(mk({ claude }));
  assert.equal(code, 1);
  assert.match(out, /END va antes que BEGIN/);
});

test("CHECK 8: CLAUDE.md sin marcadores → WARN, no bloquea", () => {
  const { code, out } = run(mk({ claude: "# Proyecto\nsin marcadores\n" }));
  assert.equal(code, 0);
  assert.match(out, /sin marcadores SDD:FRAMEWORK/);
});

test("CHECK 8: corre aunque no exista features.yaml (instalación recién hecha)", () => {
  // El root no tiene registro; CHECK 8 igual debe haberse ejecutado.
  const { out } = run(mk({ version: "9.9.9", skills: "9.9.9" }));
  assert.match(out, /versión del framework coherente \(9\.9\.9\)/);
});
