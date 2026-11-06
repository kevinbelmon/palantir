import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { guardarHistorial, leerHistorial, progresoValido, ultimoRepo } from "../servidor/historial.ts";
import { crearServidor } from "../servidor/servidor.ts";
import { ESTADO_INICIAL, reducir, restaurado } from "../src/flujo";

const avance = { briefDejado: true, agentes: ["terminado", "terminado", "habilitado", "deshabilitado", "deshabilitado", "deshabilitado", "deshabilitado", "deshabilitado"], documentoAbierto: null, fin: false };

describe("revisar un avance guardado", () => {
  it("acepta uno bueno y deja volver a esperar al que estaba corriendo", () => {
    expect(progresoValido(avance)).toEqual(avance);
    const corriendo = { ...avance, agentes: avance.agentes.map((a, i) => (i === 2 ? "corriendo" : a)) };
    expect(progresoValido(corriendo)?.agentes[2]).toBe("habilitado");
    expect(restaurado(corriendo)?.agentes[2]).toBe("habilitado");
  });

  it("descarta lo que no cuadra", () => {
    for (const malo of [null, 5, {}, { ...avance, agentes: ["terminado"] }, { ...avance, agentes: avance.agentes.map(() => "raro") }, { ...avance, documentoAbierto: 99 }, { ...avance, fin: "si" }]) {
      expect(progresoValido(malo)).toBeNull();
      expect(restaurado(malo)).toBeNull();
    }
  });

  it("restaurar en el juego pone el avance guardado; uno inválido no cambia nada", () => {
    expect(reducir(ESTADO_INICIAL, { tipo: "restaurar", estado: avance }).agentes[2]).toBe("habilitado");
    expect(reducir(ESTADO_INICIAL, { tipo: "restaurar", estado: { roto: true } })).toBe(ESTADO_INICIAL);
  });
});

describe("el historial en disco", () => {
  let base = "";
  beforeAll(() => {
    base = mkdtempSync(join(tmpdir(), "historial-test-"));
  });
  afterAll(() => rmSync(base, { recursive: true, force: true }));

  it("guarda y lee por repo, y recuerda cuál fue el último", () => {
    expect(ultimoRepo(base)).toBeNull();
    guardarHistorial(base, { url: "https://github.com/a/uno.git", nombre: "uno", briefSubido: true, salidas: { 0: "hola" }, actividad: {}, progreso: avance, chat: {} });
    guardarHistorial(base, { url: "https://github.com/a/dos.git", nombre: "dos", briefSubido: false, salidas: {}, actividad: {}, progreso: null, chat: {} });
    expect(ultimoRepo(base)).toBe("dos");
    expect(leerHistorial(base, "uno")?.progreso).toEqual(avance);
    expect(leerHistorial(base, "uno")?.salidas[0]).toBe("hola");
    expect(leerHistorial(base, "dos")?.briefSubido).toBe(false);
    expect(leerHistorial(base, "no-existe")).toBeNull();
  });
});

describe("el programa local se acuerda aunque se reinicie", () => {
  const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
  let base = "";
  let remoto = "";
  const permisivo = (u: string) => (u === remoto ? { url: remoto, nombre: "repo-memoria" } : null);
  const abrir = async () => {
    const s = crearServidor({ base: join(base, "trabajo"), validarUrl: permisivo, ejecutor: async () => ({ texto: "ok", sesion: null }) });
    await new Promise<void>((ok) => s.listen(0, "127.0.0.1", ok));
    return { s, url: `http://127.0.0.1:${(s.address() as AddressInfo).port}` };
  };
  const pedir = (url: string, ruta: string, cuerpo?: unknown) => fetch(url + ruta, { method: cuerpo === undefined ? "GET" : "POST", body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });

  beforeAll(() => {
    Object.assign(process.env, { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" });
    base = mkdtempSync(join(tmpdir(), "memoria-test-"));
    remoto = join(base, "remoto.git");
    git(base, "init", "--bare", "--initial-branch=main", remoto);
  });
  afterAll(() => rmSync(base, { recursive: true, force: true }));

  it("al volver a encender retoma el repo, el brief y el paso en que estaba", async () => {
    const uno = await abrir();
    expect((await pedir(uno.url, "/api/repo", { url: remoto })).status).toBe(200);
    expect((await pedir(uno.url, "/api/brief", { texto: "Una calculadora simple para sumar y restar." })).status).toBe(200);
    expect((await pedir(uno.url, "/api/progreso", { progreso: avance })).status).toBe(200);
    expect((await pedir(uno.url, "/api/progreso", { progreso: { roto: 1 } })).status).toBe(400);
    uno.s.close();

    const dos = await abrir();
    const e = (await (await pedir(dos.url, "/api/estado")).json()) as { repo: string; briefSubido: boolean; progreso: typeof avance };
    expect(e.repo).toBe(remoto);
    expect(e.briefSubido).toBe(true);
    expect(e.progreso).toEqual(avance);
    dos.s.close();
  }, 90_000);

  it("no guarda avance si no hay un repo conectado", async () => {
    const vacio = crearServidor({ base: join(base, "otro"), validarUrl: permisivo });
    await new Promise<void>((ok) => vacio.listen(0, "127.0.0.1", ok));
    const r = await pedir(`http://127.0.0.1:${(vacio.address() as AddressInfo).port}`, "/api/progreso", { progreso: avance });
    expect(r.status).toBe(409);
    vacio.close();
  });
});
