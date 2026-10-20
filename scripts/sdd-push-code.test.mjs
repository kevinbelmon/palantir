// Tests de los guards de sdd-push-code: resolución de la feature y la regla dura
// "nunca empujar a una rama protegida". Todos los casos salen ANTES de tocar git
// remote, así que no pushean nada.
//   node --test scripts/sdd-push-code.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "sdd-push-code.mjs");

/** Crea un DATA_ROOT con un features.yaml que declara las features dadas. */
function root(features) {
  const dir = mkdtempSync(join(tmpdir(), "sdd-push-test-"));
  mkdirSync(join(dir, "specs", "_registry"), { recursive: true });
  const yaml =
    "meta: { proyecto_id: null }\nfeatures:\n" +
    features.map((f) => `  - { id: ${f.id}, status: ${f.status} }`).join("\n") +
    "\n";
  writeFileSync(join(dir, "specs", "_registry", "features.yaml"), yaml);
  return dir;
}

function run(dir, extra = []) {
  const r = spawnSync(process.execPath, [SCRIPT, "--root", dir, ...extra], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

const cleanup = [];
test.after(() => cleanup.forEach((d) => rmSync(d, { recursive: true, force: true })));
const mk = (features) => {
  const d = root(features);
  cleanup.push(d);
  return d;
};

test("sin features OPEN → FAIL, no pushea", () => {
  const { code, out } = run(mk([{ id: "001-login", status: "CLOSED" }]));
  assert.equal(code, 1);
  assert.match(out, /no hay features OPEN/);
});

test("varias OPEN sin --feature → FAIL pidiendo elegir", () => {
  const { code, out } = run(mk([
    { id: "001-login", status: "OPEN" },
    { id: "002-signup", status: "OPEN" },
  ]));
  assert.equal(code, 1);
  assert.match(out, /hay 2 features OPEN/);
  assert.match(out, /--feature/);
});

test("--feature inexistente → FAIL", () => {
  const { code, out } = run(mk([{ id: "001-login", status: "OPEN" }]), ["--feature", "999-fantasma"]);
  assert.equal(code, 1);
  assert.match(out, /no está en el registro/);
});

test("guard de rama protegida: una feature llamada `main` no se pushea", () => {
  const { code, out } = run(mk([{ id: "main", status: "OPEN" }]));
  assert.equal(code, 1);
  assert.match(out, /protegida/);
});

test("sin registro → FAIL claro", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-push-test-"));
  cleanup.push(dir);
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /no existe specs\/_registry\/features\.yaml/);
});
