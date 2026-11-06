import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToString } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { actividadDe, resultadoDe } from "../servidor/actividad.ts";
import { crearCarpeta, escribir, leer, listar, resolverRuta } from "../servidor/archivos.ts";
import { crearCliente } from "../src/conexion";
import { PanelAgente } from "../src/ui/PanelAgente";
import { Archivos, BotonArchivos } from "../src/ui/Archivos";

const evento = (contenido: unknown[]) => JSON.stringify({ type: "assistant", message: { content: contenido } });

describe("lo que va haciendo el agente, en frases simples", () => {
  it("traduce las herramientas a frases", () => {
    expect(actividadDe(evento([{ type: "tool_use", name: "Read", input: { file_path: "C:\\repo\\drafts\\brief.md" } }]))).toEqual(["Lee repo/drafts/brief.md"]);
    expect(actividadDe(evento([{ type: "tool_use", name: "Write", input: { file_path: "/a/b/specs/x/spec.md" } }]))).toEqual(["Escribe specs/x/spec.md"]);
    expect(actividadDe(evento([{ type: "tool_use", name: "Bash", input: { command: "rm -rf /" } }]))).toEqual(["Corre un comando"]);
    expect(actividadDe(evento([{ type: "tool_use", name: "Grep", input: {} }]))).toEqual(["Busca en el proyecto"]);
  });

  it("cuenta lo que dice y no muestra comandos ni datos crudos", () => {
    const f = actividadDe(evento([{ type: "text", text: "Voy a leer   el brief\ny preguntar." }, { type: "tool_use", name: "Bash", input: { command: "secreto" } }]));
    expect(f[0]).toBe("Dice: Voy a leer el brief y preguntar.");
    expect(actividadDe(evento([{ type: "text", text: "**Análisis** de `drafts/brief.md`" }]))).toEqual(["Dice: Análisis de drafts/brief.md"]);
    expect(f.join(" ")).not.toContain("secreto");
  });

  it("ignora lo que no entiende", () => {
    expect(actividadDe("no es json")).toEqual([]);
    expect(actividadDe(JSON.stringify({ type: "user" }))).toEqual([]);
    expect(actividadDe("[1,2]")).toEqual([]);
  });

  it("saca el mensaje final del evento resultado", () => {
    expect(resultadoDe(JSON.stringify({ type: "result", result: "Listo." }))).toBe("Listo.");
    expect(resultadoDe(JSON.stringify({ type: "assistant" }))).toBeNull();
  });
});

describe("rutas dentro del repo", () => {
  const carpeta = join(tmpdir(), "repo-falso");

  it("acepta rutas normales", () => {
    expect(resolverRuta(carpeta, "drafts/brief.md")).toBe(join(carpeta, "drafts", "brief.md"));
    expect(resolverRuta(carpeta, "")).toBe(carpeta);
  });

  it("rechaza salirse del repo, rutas del sistema y la carpeta de git", () => {
    for (const mala of ["../afuera", "a/../../b", "..", ".git/config", "a/.git/x", "node_modules/x", "C:\\Windows", "a/b:c", "a\\..\\..\\b"]) {
      expect(() => resolverRuta(carpeta, mala), mala).toThrow();
    }
    expect(() => resolverRuta(carpeta, "/etc/passwd")).not.toThrow(); // la barra inicial se toma como la raíz del repo
    expect(resolverRuta(carpeta, "/etc/passwd")).toBe(join(carpeta, "etc", "passwd"));
  });
});

describe("carpetas y archivos del repo", () => {
  let base = "";
  let remoto = "";
  let repo = "";
  const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

  beforeAll(() => {
    Object.assign(process.env, { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" });
    base = mkdtempSync(join(tmpdir(), "archivos-test-"));
    remoto = join(base, "remoto.git");
    repo = join(base, "repo");
    git(base, "init", "--bare", "--initial-branch=main", remoto);
    git(base, "clone", remoto, repo);
    mkdirSync(join(repo, "drafts"));
    writeFileSync(join(repo, "drafts", "brief.md"), "hola");
    writeFileSync(join(repo, "z.txt"), "z");
    writeFileSync(join(repo, "a.txt"), "a");
    git(repo, "add", "-A");
    git(repo, "commit", "-m", "base");
    git(repo, "push", "-u", "origin", "HEAD");
  });
  afterAll(() => rmSync(base, { recursive: true, force: true }));

  it("lista las carpetas primero, y esconde .git", () => {
    expect(listar(repo, "").map((e) => `${e.tipo}:${e.nombre}`)).toEqual(["carpeta:drafts", "archivo:a.txt", "archivo:z.txt"]);
    expect(leer(repo, "drafts/brief.md")).toBe("hola");
    expect(() => leer(repo, "drafts")).toThrow();
  });

  it("crea un archivo (por ejemplo un README) y lo sube", async () => {
    await escribir(repo, "README.md", "# Mi proyecto\n");
    expect(readFileSync(join(repo, "README.md"), "utf8")).toBe("# Mi proyecto\n");
    expect(git(remoto, "show", "main:README.md")).toContain("Mi proyecto");
    await expect(escribir(repo, "", "x")).rejects.toThrow();
    await expect(escribir(repo, "../fuera.txt", "x")).rejects.toThrow();
    expect(existsSync(join(base, "fuera.txt"))).toBe(false);
  }, 60_000);

  it("crea una carpeta y la sube con un archivo vacío adentro", async () => {
    await crearCarpeta(repo, "documentos/ideas");
    expect(git(remoto, "ls-tree", "-r", "--name-only", "main")).toContain("documentos/ideas/.gitkeep");
  }, 60_000);
});

describe("la pantalla de archivos y el panel del agente", () => {
  it("muestra el botón y el panel de archivos", () => {
    expect(renderToString(<BotonArchivos alAbrir={() => {}} />)).toContain("Archivos");
    const h = renderToString(<Archivos cliente={crearCliente()} alCerrar={() => {}} />);
    expect(h).toContain("Archivos del repo");
    expect(h).toContain("raíz");
  });

  const panel = (estado: "corriendo" | "terminado", actividad?: string[]) =>
    renderToString(<PanelAgente indice={0} estado={estado} briefDejado alOrdenar={() => {}} alCerrar={() => {}} alLeer={() => {}} actividad={actividad} />);

  it("mientras trabaja muestra lo que va haciendo, y sin registro cuenta lo de su globito", () => {
    const h = panel("corriendo", ["Lee drafts/brief.md", "Escribe input.md"]);
    expect(h).toContain("Lee drafts/brief.md");
    expect(h).toContain("Escribe input.md");
    expect(panel("corriendo")).toContain("Estoy leyendo el brief");
  });

  it("al terminar deja ver lo que hizo", () => {
    const h = panel("terminado", ["Escribe input.md"]);
    expect(h).toContain("Lo que hizo");
    expect(h).toContain("Escribe input.md");
  });
});
