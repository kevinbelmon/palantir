import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { COMANDOS } from "../servidor/agentes.ts";
import { guardarBrief, prepararRepo, urlDeRepo } from "../servidor/repo.ts";
import { crearServidor } from "../servidor/servidor.ts";

describe("el link del repositorio", () => {
  it("acepta los links de GitHub y los deja en https", () => {
    expect(urlDeRepo("https://github.com/kbelmonte/mi-repo")).toEqual({ url: "https://github.com/kbelmonte/mi-repo.git", nombre: "mi-repo" });
    expect(urlDeRepo("  https://github.com/kbelmonte/mi-repo.git/ ")?.nombre).toBe("mi-repo");
    expect(urlDeRepo("git@github.com:kbelmonte/mi-repo.git")?.url).toBe("https://github.com/kbelmonte/mi-repo.git");
  });

  it("rechaza lo que no es un repo de GitHub, o lo que podría ser un comando", () => {
    for (const malo of ["", "hola", "https://gitlab.com/a/b", "https://github.com/a", "https://github.com/a/b/c", "--upload-pack=calc", "file:///tmp/x", "https://github.com/../b", "https://github.com/a/b;rm -rf", "https://github.com/a b/c"]) {
      expect(urlDeRepo(malo), malo).toBeNull();
    }
  });
});

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
let base = "";
let remoto = "";
const permisivo = (u: string) => (u === remoto ? { url: remoto, nombre: "repo-de-prueba" } : null);

beforeAll(() => {
  Object.assign(process.env, { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" });
  base = mkdtempSync(join(tmpdir(), "juego-test-"));
  remoto = join(base, "remoto.git");
  git(base, "init", "--bare", "--initial-branch=main", remoto);
});
afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("preparar el repo y guardar el brief", () => {
  const carpeta = () => join(base, "trabajo", "repo-de-prueba");

  it("clona el repo vacío, instala el modelo SDD y lo sube", async () => {
    await prepararRepo(remoto, carpeta());
    expect(existsSync(join(carpeta(), ".claude", "commands", "sdd-refine.md"))).toBe(true);
    expect(existsSync(join(carpeta(), "drafts"))).toBe(true);
    expect(git(remoto, "log", "--oneline", "main")).toContain("instala el modelo SDD");
  }, 60_000);

  it("guarda el brief en drafts/ y lo sube; rechaza uno vacío", async () => {
    await guardarBrief(carpeta(), "Quiero una app para llevar la lista de compras de la casa.");
    expect(readFileSync(join(carpeta(), "drafts", "brief.md"), "utf8")).toContain("lista de compras");
    expect(git(remoto, "show", "main:drafts/brief.md")).toContain("lista de compras");
    await expect(guardarBrief(carpeta(), "  corto ")).rejects.toThrow();
  }, 60_000);
});

describe("el programa local", () => {
  let servidor: ReturnType<typeof crearServidor>;
  let url = "";
  const llamadas: string[] = [];

  beforeAll(async () => {
    servidor = crearServidor({
      base: join(base, "servidor"),
      validarUrl: permisivo,
      ejecutor: async (_c, comando) => {
        llamadas.push(comando);
        return `Listo: ${comando}`;
      },
    });
    await new Promise<void>((ok) => servidor.listen(0, "127.0.0.1", ok));
    url = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  });
  afterAll(() => servidor.close());

  const pedir = (ruta: string, cuerpo?: unknown, cabeceras: Record<string, string> = {}) =>
    fetch(url + ruta, { method: cuerpo === undefined ? "GET" : "POST", body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo), headers: cabeceras });

  it("no corre nada hasta tener repo y brief", async () => {
    expect((await pedir("/api/brief", { texto: "un brief largo y claro" })).status).toBe(409);
    expect((await pedir("/api/agente", { indice: 0 })).status).toBe(409);
  });

  it("rechaza un link inválido", async () => {
    expect((await pedir("/api/repo", { url: "https://gitlab.com/a/b" })).status).toBe(400);
  });

  it("no atiende a una página de otro origen", async () => {
    expect((await pedir("/api/estado", undefined, { origin: "https://sitio-malo.example" })).status).toBe(403);
    expect((await pedir("/api/estado", undefined, { origin: "http://localhost:5173" })).status).toBe(200);
  });

  it("con repo y brief, corre el agente pedido y sube lo que cambió", async () => {
    expect((await pedir("/api/repo", { url: remoto })).status).toBe(200);
    expect((await pedir("/api/brief", { texto: "Una app para dividir gastos entre amigos." })).status).toBe(200);
    const r = await pedir("/api/agente", { indice: 1 });
    const cuerpo = (await r.json()) as { salida: string; salidas: Record<string, string> };
    expect(r.status).toBe(200);
    expect(cuerpo.salida).toBe("Listo: sdd-generate");
    expect(llamadas).toEqual(["sdd-generate"]);
    expect(cuerpo.salidas["1"]).toBe("Listo: sdd-generate");
  }, 60_000);

  it("rechaza un agente que no existe", async () => {
    expect((await pedir("/api/agente", { indice: 99 })).status).toBe(500);
    expect((await pedir("/api/agente", { indice: "x" })).status).toBe(400);
  });

  it("los 8 comandos están en el orden del juego", () => {
    expect(COMANDOS).toHaveLength(8);
    expect(COMANDOS[0]).toBe("sdd-refine");
    expect(COMANDOS[7]).toBe("sdd-review");
  });
});
