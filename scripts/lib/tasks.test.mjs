// Tests del parser único de tasks.md (lib/tasks.mjs).
// Node test runner, cero dependencias:  node --test scripts/lib/tasks.test.mjs
//
// El caso que da nombre a todo esto es el de la negrita: la primera corrida
// greenfield real produjo `- [ ] **T001** · …` y el patrón estricto contaba cero.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTasks } from "./tasks.mjs";

test("checkbox: cuenta total y hechas", () => {
  const r = parseTasks("- [ ] T001 crear algo · US-1\n- [x] T002 otra cosa · US-2\n");
  assert.equal(r.format, "canonico");
  assert.equal(r.checkbox.total, 2);
  assert.equal(r.checkbox.done, 1);
});

test("negrita: el ID en **T001** se cuenta igual (el bug que originó el parser)", () => {
  const r = parseTasks("- [ ] **T001** · hacer X · US-1\n- [x] **T002** · hacer Y · US-2\n");
  assert.equal(r.checkbox.total, 2);
  assert.equal(r.checkbox.done, 1);
});

test("tabla: cuenta filas y deja hechas sin saber (done null, formato tabla)", () => {
  const r = parseTasks("| ID | tarea | estado |\n| T01 | algo | ✅ |\n| T02 | más | ⬜ |\n");
  assert.equal(r.format, "tabla");
  assert.equal(r.tableRows, 2);
  assert.equal(r.checkbox.total, 0);
});

test("fila de encabezado de tabla no cuenta como task", () => {
  // `| ID | … |` no matchea porque ID no es T\\d+
  const r = parseTasks("| ID | descripción |\n| T01 | una |\n");
  assert.equal(r.tableRows, 1);
});

test("US-N: una tarea sin referencia queda en sinUS", () => {
  const r = parseTasks("- [ ] T001 con ref · US-1\n- [ ] T002 sin ref\n");
  assert.deepEqual(r.sinUS, ["T002"]);
});

test("US-N: el placeholder `—` cuenta como trazabilidad presente", () => {
  const r = parseTasks("- [ ] T001 scaffold · US: —\n");
  assert.deepEqual(r.sinUS, []);
});

test("US-N: se detecta en una línea de continuación del bloque, no solo en el encabezado", () => {
  const r = parseTasks("- [ ] T001 hacer algo\n      implementa US-3 del spec\n- [ ] T002 otra · US-4\n");
  assert.deepEqual(r.sinUS, []);
});

test("encabezado sin checkbox entra al conjunto de CHECK 6 pero no al conteo de progreso", () => {
  const r = parseTasks("- **T001** · encabezado sin checkbox\n");
  assert.equal(r.checkbox.total, 0); // taskCounts no lo cuenta
  assert.equal(r.headers.length, 1); // CHECK 6 sí lo mira
  assert.deepEqual(r.sinUS, ["T001"]); // y le reclama el US-N
});

test("vacío / sin líneas reconocibles → formato ninguno", () => {
  const r = parseTasks("# tasks\n\nsolo prosa, nada de tareas\n");
  assert.equal(r.format, "ninguno");
  assert.equal(r.checkbox.total, 0);
  assert.equal(r.tableRows, 0);
});

test("ID de 3 dígitos: se conserva T\\d{3}, no cuenta T12 ni T1234 como T123", () => {
  // Decisión del roadmap: mantener T\\d{3} exacto para no cambiar comportamiento.
  const r = parseTasks("- [ ] T12 corto\n- [ ] T123 justo\n");
  assert.equal(r.checkbox.total, 1); // solo T123
  assert.equal(r.headers[0].id, "T123");
});
