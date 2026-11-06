import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { guardarYSubir } from "./repo.ts";

export type Entrada = { nombre: string; tipo: "carpeta" | "archivo" };

const OCULTAS = new Set([".git", "node_modules"]);
export const MAX_ARCHIVO = 200_000;

/** Convierte una ruta del repo (relativa, con «/») en una ruta del disco dentro de `carpeta`. Si se sale, tira error. */
export function resolverRuta(carpeta: string, ruta: string): string {
  const limpia = ruta.replace(/\\/g, "/").replace(/^\/+/, "");
  const partes = limpia.split("/").filter(Boolean);
  if (partes.some((p) => p === ".." || p === "." || OCULTAS.has(p) || /[<>:"|?*\0]/.test(p))) throw new Error("Esa ruta no está permitida.");
  const destino = resolve(carpeta, ...partes);
  const raiz = resolve(carpeta);
  if (destino !== raiz && !destino.startsWith(raiz + sep)) throw new Error("Esa ruta no está permitida.");
  return destino;
}

/** Carpetas primero, después archivos, cada grupo por orden alfabético. */
export function listar(carpeta: string, ruta: string): Entrada[] {
  const destino = resolverRuta(carpeta, ruta);
  return readdirSync(destino, { withFileTypes: true })
    .filter((d) => !OCULTAS.has(d.name))
    .map((d): Entrada => ({ nombre: d.name, tipo: d.isDirectory() ? "carpeta" : "archivo" }))
    .sort((a, b) => (a.tipo === b.tipo ? a.nombre.localeCompare(b.nombre) : a.tipo === "carpeta" ? -1 : 1));
}

export function leer(carpeta: string, ruta: string): string {
  const destino = resolverRuta(carpeta, ruta);
  const info = statSync(destino);
  if (!info.isFile()) throw new Error("Eso no es un archivo.");
  if (info.size > MAX_ARCHIVO) throw new Error("El archivo es demasiado grande para abrirlo acá.");
  return readFileSync(destino, "utf8");
}

/** Crea o reemplaza un archivo de texto y lo sube. */
export async function escribir(carpeta: string, ruta: string, texto: string): Promise<void> {
  if (texto.length > MAX_ARCHIVO) throw new Error("El archivo es demasiado grande.");
  const destino = resolverRuta(carpeta, ruta);
  if (destino === resolve(carpeta)) throw new Error("Falta el nombre del archivo.");
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, texto, "utf8");
  await guardarYSubir(carpeta, `docs: ${ruta} (desde el juego)`);
}

/** Crea una carpeta (con un archivo vacío adentro, porque git no guarda carpetas vacías) y la sube. */
export async function crearCarpeta(carpeta: string, ruta: string): Promise<void> {
  const destino = resolverRuta(carpeta, ruta);
  if (destino === resolve(carpeta)) throw new Error("Falta el nombre de la carpeta.");
  mkdirSync(destino, { recursive: true });
  writeFileSync(join(destino, ".gitkeep"), "");
  await guardarYSubir(carpeta, `chore: carpeta ${ruta} (desde el juego)`);
}
