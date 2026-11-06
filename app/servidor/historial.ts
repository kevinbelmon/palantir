import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Dónde va la persona en el juego (lo mismo que el estado de la pantalla). */
export type Progreso = { briefDejado: boolean; agentes: string[]; documentoAbierto: number | null; fin: boolean };

export type Historial = {
  url: string;
  nombre: string;
  briefSubido: boolean;
  salidas: Record<number, string>;
  actividad: Record<number, string[]>;
  progreso: Progreso | null;
};

const ESTADOS = new Set(["deshabilitado", "habilitado", "corriendo", "terminado"]);

/** Revisa que lo que llega sea de verdad un progreso del juego. Un agente que figuraba «corriendo» vuelve a esperar la orden. */
export function progresoValido(x: unknown): Progreso | null {
  if (typeof x !== "object" || x === null) return null;
  const p = x as Record<string, unknown>;
  if (typeof p.briefDejado !== "boolean" || typeof p.fin !== "boolean") return null;
  if (!Array.isArray(p.agentes) || p.agentes.length !== 8 || !p.agentes.every((a) => typeof a === "string" && ESTADOS.has(a))) return null;
  const doc = p.documentoAbierto;
  if (doc !== null && !(typeof doc === "number" && Number.isInteger(doc) && doc >= 0 && doc < 8)) return null;
  return { briefDejado: p.briefDejado, fin: p.fin, documentoAbierto: doc as number | null, agentes: (p.agentes as string[]).map((a) => (a === "corriendo" ? "habilitado" : a)) };
}

const carpeta = (base: string) => join(base, ".historial");
const archivo = (base: string, nombre: string) => join(carpeta(base), `${nombre.replace(/[^A-Za-z0-9_.-]/g, "_")}.json`);

export function guardarHistorial(base: string, h: Historial): void {
  mkdirSync(carpeta(base), { recursive: true });
  writeFileSync(archivo(base, h.nombre), JSON.stringify(h), "utf8");
  writeFileSync(join(carpeta(base), "ultimo.json"), JSON.stringify({ nombre: h.nombre }), "utf8");
}

function leerJson(ruta: string): unknown {
  try {
    return existsSync(ruta) ? JSON.parse(readFileSync(ruta, "utf8")) : null;
  } catch {
    return null;
  }
}

/** El historial guardado de un repo, o null si no hay o está dañado. */
export function leerHistorial(base: string, nombre: string): Historial | null {
  const x = leerJson(archivo(base, nombre));
  if (typeof x !== "object" || x === null) return null;
  const h = x as Partial<Historial>;
  if (typeof h.url !== "string" || typeof h.nombre !== "string") return null;
  return {
    url: h.url,
    nombre: h.nombre,
    briefSubido: h.briefSubido === true,
    salidas: typeof h.salidas === "object" && h.salidas !== null ? h.salidas : {},
    actividad: typeof h.actividad === "object" && h.actividad !== null ? h.actividad : {},
    progreso: progresoValido(h.progreso),
  };
}

/** El último repo que se usó (para retomar donde se dejó al volver a abrir). */
export function ultimoRepo(base: string): string | null {
  const x = leerJson(join(carpeta(base), "ultimo.json"));
  return typeof x === "object" && x !== null && typeof (x as { nombre?: unknown }).nombre === "string" ? (x as { nombre: string }).nombre : null;
}
