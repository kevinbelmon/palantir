// Tests de parseGitRemote (lib/estado.mjs) — la parte sensible del dato `source.git`:
// descompone el remote y, sobre todo, NUNCA deja pasar un token al host publicado.
//   node --test scripts/lib/estado.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGitRemote } from "./estado.mjs";

test("https simple → host y path sin .git", () => {
  assert.deepEqual(parseGitRemote("https://gitlab.proguidemc.com/beepmp/web-health.git"), {
    host: "gitlab.proguidemc.com",
    path: "beepmp/web-health",
  });
});

test("https sin .git final", () => {
  assert.deepEqual(parseGitRemote("https://github.com/org/repo"), {
    host: "github.com",
    path: "org/repo",
  });
});

test("SEGURIDAD: https con oauth2:<token>@ — el token NO llega al host", () => {
  const r = parseGitRemote("https://oauth2:glpat-SECRETO123@gitlab.proguidemc.com/beepmp/web-health.git");
  assert.equal(r.host, "gitlab.proguidemc.com");
  assert.equal(r.path, "beepmp/web-health");
  assert.doesNotMatch(JSON.stringify(r), /SECRETO123|oauth2|glpat/);
});

test("SEGURIDAD: https con x-access-token:<token>@ — idem", () => {
  const r = parseGitRemote("https://x-access-token:ghp_SECRETO@github.com/org/repo.git");
  assert.equal(r.host, "github.com");
  assert.equal(r.path, "org/repo");
  assert.doesNotMatch(JSON.stringify(r), /SECRETO|x-access-token|ghp_/);
});

test("https con user@ (sin token) — el user se descarta", () => {
  assert.deepEqual(parseGitRemote("https://patricio@github.com/org/repo.git"), {
    host: "github.com",
    path: "org/repo",
  });
});

test("SSH scp-like git@host:grupo/repo.git", () => {
  assert.deepEqual(parseGitRemote("git@gitlab.proguidemc.com:beepmp/web-health.git"), {
    host: "gitlab.proguidemc.com",
    path: "beepmp/web-health",
  });
});

test("ssh:// con puerto — host sin puerto", () => {
  assert.deepEqual(parseGitRemote("ssh://git@gitlab.proguidemc.com:2222/beepmp/web-health.git"), {
    host: "gitlab.proguidemc.com",
    path: "beepmp/web-health",
  });
});

test("path anidado de monorepo (grupo/subgrupo/repo)", () => {
  assert.deepEqual(parseGitRemote("git@gitlab.proguidemc.com:grupo/sub/repo.git"), {
    host: "gitlab.proguidemc.com",
    path: "grupo/sub/repo",
  });
});

test("entradas inválidas → null", () => {
  assert.equal(parseGitRemote(""), null);
  assert.equal(parseGitRemote(null), null);
  assert.equal(parseGitRemote("no-es-una-url"), null);
});
