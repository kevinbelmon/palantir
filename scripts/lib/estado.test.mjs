// Tests de lib/estado.mjs — construyen un DATA_ROOT temporal y verifican que
// el estado publicado derive "cerrada" de la EVIDENCIA, no del `status` crudo
// del registro.
//   node --test scripts/lib/estado.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { leerEstado, avisos } from "./estado.mjs";

/**
 * Crea un root con una sola feature `001-x` en el status dado, y opcionalmente
 * un metrics con bloque `## Review` aprobado. Devuelve la ruta.
 */
function root({ status = "CLOSED", reviewAprobado = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sdd-estado-test-"));
  for (const d of ["specs/001-x", "metrics", "graph", "specs/_registry"])
    mkdirSync(join(dir, d), { recursive: true });

  writeFileSync(
    join(dir, "specs/_registry/features.yaml"),
    [
      "meta:",
      "  repo: test/repo",
      "  proyecto_id: PRY-001",
      "features:",
      "  - id: 001-x",
      `    status: ${status}`,
      "    created: 2026-01-01",
      "    closed: 2026-02-01",
      "",
    ].join("\n")
  );

  if (reviewAprobado) {
    writeFileSync(
      join(dir, "metrics/001-x-metrics.md"),
      "## Review\n- resultado: APROBADO\n"
    );
  }
  return dir;
}

const cleanup = [];
test.after(() => cleanup.forEach((d) => rmSync(d, { recursive: true, force: true })));
const mk = (o) => { const d = root(o); cleanup.push(d); return d; };

test("CLOSED con `## Review: APROBADO` → se publica como CLOSED", () => {
  const e = leerEstado(mk({ status: "CLOSED", reviewAprobado: true }));
  const f = e.features[0];
  assert.equal(f.status, "CLOSED");
  assert.equal(f.cierre_sin_evidencia, false);
  assert.equal(f.closed, "2026-02-01");
  assert.equal(e.resumen.closed, 1);
  assert.equal(e.resumen.closed_sin_verificar, 0);
});

test("CLOSED sin evidencia → NO se publica como cerrada (cae a OPEN)", () => {
  const e = leerEstado(mk({ status: "CLOSED", reviewAprobado: false }));
  const f = e.features[0];
  assert.equal(f.status, "OPEN");
  assert.equal(f.status_declarado, "CLOSED");
  assert.equal(f.cierre_sin_evidencia, true);
  assert.match(f.cierre_motivo, /no verificado/);
  assert.equal(f.closed, null); // no exhibe fecha de cierre
  assert.equal(e.resumen.closed, 0);
  assert.equal(e.resumen.closed_sin_verificar, 1);
  assert.equal(e.resumen.open, 1);
});

test("CLOSED sin evidencia → emite aviso", () => {
  const e = leerEstado(mk({ status: "CLOSED", reviewAprobado: false }));
  assert.ok(avisos(e).some((a) => /CLOSED sin evidencia/.test(a)));
});

test("OPEN sin review → sigue OPEN, sin falsos positivos de cierre", () => {
  const e = leerEstado(mk({ status: "OPEN", reviewAprobado: false }));
  const f = e.features[0];
  assert.equal(f.status, "OPEN");
  assert.equal(f.cierre_sin_evidencia, false);
  assert.equal(e.resumen.closed_sin_verificar, 0);
});
