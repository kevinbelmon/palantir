import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToString } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sesionDe } from "../servidor/actividad.ts";
import { ejecutorClaude } from "../servidor/agentes.ts";
import { crearServidor } from "../servidor/servidor.ts";
import { ANCHO_PANEL, PanelAgente } from "../src/ui/PanelAgente";

describe("la conversación con el agente (programa local)", () => {
  const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
  let base = "";
  let remoto = "";
  let url = "";
  let servidor: ReturnType<typeof crearServidor>;
  const pedidos: { prompt: string; sesion: string | null }[] = [];

  beforeAll(async () => {
    Object.assign(process.env, { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" });
    base = mkdtempSync(join(tmpdir(), "chat-test-"));
    remoto = join(base, "remoto.git");
    git(base, "init", "--bare", "--initial-branch=main", remoto);
    servidor = crearServidor({
      base: join(base, "trabajo"),
      validarUrl: (u) => (u === remoto ? { url: remoto, nombre: "repo-chat" } : null),
      ejecutor: async (_c, prompt, sesion) => {
        pedidos.push({ prompt, sesion });
        return { texto: pedidos.length === 1 ? "¿Querés una web o una app de terminal?" : "Perfecto, anoté: web.", sesion: "sesion-1234abcd" };
      },
    });
    await new Promise<void>((ok) => servidor.listen(0, "127.0.0.1", ok));
    url = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  });
  afterAll(() => {
    servidor.close();
    rmSync(base, { recursive: true, force: true });
  });

  const pedir = (ruta: string, cuerpo?: unknown) => fetch(url + ruta, { method: cuerpo === undefined ? "GET" : "POST", body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  type Estado = { chat: Record<string, { rol: string; texto: string }[]>; corriendo: number | null };

  it("no deja escribirle a un agente que todavía no empezó", async () => {
    await pedir("/api/repo", { url: remoto });
    await pedir("/api/brief", { texto: "Una calculadora simple para sumar y restar." });
    expect((await pedir("/api/mensaje", { indice: 0, texto: "hola" })).status).toBe(400);
  }, 90_000);

  it("el agente pregunta, la persona contesta y sigue la misma conversación", async () => {
    const primero = (await (await pedir("/api/agente", { indice: 0 })).json()) as Estado;
    expect(pedidos[0]).toEqual({ prompt: "/sdd-refine", sesion: null });
    expect(primero.chat["0"]).toEqual([{ rol: "agente", texto: "¿Querés una web o una app de terminal?" }]);

    const segundo = (await (await pedir("/api/mensaje", { indice: 0, texto: "  Una web  " })).json()) as Estado;
    expect(pedidos[1]).toEqual({ prompt: "Una web", sesion: "sesion-1234abcd" });
    expect(segundo.chat["0"].map((m) => m.rol)).toEqual(["agente", "persona", "agente"]);
    expect(segundo.corriendo).toBeNull();
  }, 60_000);

  it("ordenar de nuevo al mismo agente no lo corre otra vez", async () => {
    const antes = pedidos.length;
    expect((await pedir("/api/agente", { indice: 0 })).status).toBe(200);
    expect(pedidos).toHaveLength(antes);
  });

  it("rechaza un mensaje vacío o larguísimo", async () => {
    expect((await pedir("/api/mensaje", { indice: 0, texto: "   " })).status).toBe(400);
    expect((await pedir("/api/mensaje", { indice: 0, texto: "x".repeat(5000) })).status).toBe(400);
  });

  it("la sesión no puede traer nada raro a la línea de comando", async () => {
    await expect(ejecutorClaude(base, "hola", "abc; calc", () => {})).rejects.toThrow();
    expect(sesionDe(JSON.stringify({ session_id: "abc-123" }))).toBe("abc-123");
    expect(sesionDe("no es json")).toBeNull();
  });
});

describe("el panel de la derecha con chat", () => {
  const base = { indice: 0, briefDejado: true, alOrdenar: () => {}, alCerrar: () => {} };
  const msgs = [
    { rol: "agente", texto: "Voy a **pulir** tu idea. ¿Para quién es?" },
    { rol: "persona", texto: "Para mi familia" },
  ] as const;

  it("muestra la conversación, con negritas, y deja contestar y dar el paso por listo", () => {
    const h = renderToString(<PanelAgente {...base} estado="corriendo" mensajes={msgs} alEnviar={() => {}} alTerminar={() => {}} />);
    expect(h).toContain("<strong>pulir</strong>");
    expect(h).toContain("Para mi familia");
    expect(h).toContain("Enviar");
    expect(h).toContain("Este paso está listo");
    expect(h).toContain('aria-label="Tu respuesta"');
  });

  it("mientras el agente trabaja, no deja escribir y muestra lo que hace", () => {
    const h = renderToString(<PanelAgente {...base} estado="corriendo" mensajes={msgs} ocupado actividad={["Lee drafts/brief.md"]} alEnviar={() => {}} alTerminar={() => {}} />);
    expect(h).toContain("Lee drafts/brief.md");
    expect(h).toContain("disabled");
  });

  it("queda a la derecha y es angosto, para no tapar la oficina", () => {
    expect(ANCHO_PANEL).toBeLessThanOrEqual(420);
    expect(renderToString(<PanelAgente {...base} estado="habilitado" />)).toContain("right:14px");
  });
});
