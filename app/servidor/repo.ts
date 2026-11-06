import { execFile } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type Repo = { url: string; nombre: string };

const PARTE = /^[A-Za-z0-9_.-]{1,100}$/;

/** Acepta el link de un repo de GitHub (https o ssh) y lo deja en forma https. Cualquier otra cosa da null. */
export function urlDeRepo(entrada: string): Repo | null {
  const t = entrada.trim().replace(/\/+$/, "");
  const m = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)$/.exec(t) ?? /^git@github\.com:([^/\s]+)\/([^/\s]+)$/.exec(t);
  if (!m) return null;
  const dueno = m[1];
  const nombre = m[2].replace(/\.git$/, "");
  if (!PARTE.test(dueno) || !PARTE.test(nombre) || nombre === "." || nombre === ".." || dueno === "." || dueno === "..") return null;
  return { url: `https://github.com/${dueno}/${nombre}.git`, nombre };
}

/** Corre un programa sin pasar por una terminal: los argumentos nunca se interpretan como comandos. */
export function ejecutar(programa: string, args: string[], cwd: string, timeoutMs = 120_000): Promise<string> {
  return new Promise((ok, fallo) => {
    execFile(programa, args, { cwd, timeout: timeoutMs, windowsHide: true, maxBuffer: 16 * 1024 * 1024, shell: programa.endsWith(".cmd") }, (error, stdout, stderr) => {
      if (error) fallo(new Error(`${programa} ${args[0] ?? ""}: ${(stderr || error.message).toString().trim().slice(0, 400)}`));
      else ok(stdout.toString());
    });
  });
}

const git = (cwd: string, ...args: string[]) => ejecutar("git", args, cwd);

/** Si hay cambios, los guarda en un commit y los sube. Devuelve si hizo commit. */
export async function guardarYSubir(carpeta: string, mensaje: string): Promise<boolean> {
  await git(carpeta, "add", "-A");
  const cambios = (await git(carpeta, "status", "--porcelain")).trim();
  if (cambios) await git(carpeta, "commit", "-m", mensaje);
  await git(carpeta, "push", "-u", "origin", "HEAD");
  return cambios !== "";
}

const RAIZ_MODELO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Clona (o actualiza) el repo, instala el modelo SDD con el instalador del propio modelo y lo sube. */
export async function prepararRepo(origen: string, carpeta: string): Promise<{ carpeta: string; commit: boolean }> {
  if (existsSync(join(carpeta, ".git"))) await git(carpeta, "pull", "--ff-only").catch(() => "");
  else {
    mkdirSync(dirname(carpeta), { recursive: true });
    await ejecutar("git", ["clone", origen, carpeta], dirname(carpeta));
  }
  await ejecutar(process.execPath, [join(RAIZ_MODELO, "scripts", "sdd-install.mjs"), "--root", carpeta], RAIZ_MODELO);
  mkdirSync(join(carpeta, "drafts"), { recursive: true });
  const ancla = join(carpeta, "drafts", ".gitkeep");
  if (!existsSync(ancla)) writeFileSync(ancla, "");
  const commit = await guardarYSubir(carpeta, "chore: instala el modelo SDD desde el juego");
  return { carpeta, commit };
}

export const MAX_BRIEF = 20_000;

/** Guarda el brief que escribió la persona en `drafts/brief.md` y lo sube. */
export async function guardarBrief(carpeta: string, texto: string): Promise<{ commit: boolean }> {
  const limpio = texto.trim();
  if (limpio.length < 10) throw new Error("El brief es muy corto: contá qué querés construir.");
  if (limpio.length > MAX_BRIEF) throw new Error("El brief es demasiado largo.");
  mkdirSync(join(carpeta, "drafts"), { recursive: true });
  writeFileSync(join(carpeta, "drafts", "brief.md"), limpio + "\n", "utf8");
  return { commit: await guardarYSubir(carpeta, "docs: brief escrito en el juego") };
}
