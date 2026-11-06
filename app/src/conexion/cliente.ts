/** Lo que cuenta el programa local sobre la conexión de la persona. */
export type EstadoLocal = {
  repo: string | null;
  modeloInstalado: boolean;
  briefSubido: boolean;
  corriendo: number | null;
  salidas: Record<string, string>;
  /** Lo que fue haciendo cada agente, en frases simples (la última línea es lo más reciente). */
  actividad: Record<string, string[]>;
  progreso: ProgresoJuego | null;
  /** La conversación con cada agente. */
  chat: Record<string, Mensaje[]>;
};

/** Dónde va la persona en el juego, para retomar donde dejó. */
export type ProgresoJuego = { briefDejado: boolean; agentes: readonly string[]; documentoAbierto: number | null; fin: boolean };

export type Mensaje = { rol: "agente" | "persona"; texto: string };

export type Entrada = { nombre: string; tipo: "carpeta" | "archivo" };

export const SIN_CONEXION: EstadoLocal = { repo: null, modeloInstalado: false, briefSubido: false, corriendo: null, salidas: {}, actividad: {}, progreso: null, chat: {} };

export const AVISO_SIN_PROGRAMA = "No encuentro el programa local. Encendelo en una terminal con «pnpm servidor» y volvé a intentar.";

type Pedir = (ruta: string, cuerpo?: unknown) => Promise<Response>;

const pedirReal: Pedir = (ruta, cuerpo) =>
  fetch(ruta, {
    method: cuerpo === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

async function llamar<T>(pedir: Pedir, ruta: string, cuerpo?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await pedir(ruta, cuerpo);
  } catch {
    throw new Error(AVISO_SIN_PROGRAMA);
  }
  let datos: unknown = null;
  try {
    datos = await r.json();
  } catch {
    // el programa local siempre contesta JSON; si no, es otra cosa lo que escucha en ese puerto
    throw new Error(AVISO_SIN_PROGRAMA);
  }
  if (!r.ok) {
    const mensaje = typeof datos === "object" && datos !== null && "error" in datos ? String((datos as { error: unknown }).error) : "Algo salió mal.";
    throw new Error(mensaje);
  }
  return datos as T;
}

/** Cliente del programa local (el que clona el repo, guarda el brief y corre los agentes de verdad). */
export function crearCliente(pedir: Pedir = pedirReal) {
  return {
    estado: () => llamar<EstadoLocal>(pedir, "/api/estado"),
    conectarRepo: (url: string) => llamar<EstadoLocal>(pedir, "/api/repo", { url }),
    subirBrief: (texto: string) => llamar<EstadoLocal>(pedir, "/api/brief", { texto }),
    correrAgente: (indice: number) => llamar<EstadoLocal & { salida: string }>(pedir, "/api/agente", { indice }),
    enviarMensaje: (indice: number, texto: string) => llamar<EstadoLocal & { salida: string }>(pedir, "/api/mensaje", { indice, texto }),
    guardarProgreso: (progreso: ProgresoJuego) => llamar<{ ok: true }>(pedir, "/api/progreso", { progreso }),
    archivos: (ruta: string) => llamar<{ ruta: string; entradas: Entrada[] }>(pedir, `/api/archivos?ruta=${encodeURIComponent(ruta)}`),
    leerArchivo: (ruta: string) => llamar<{ ruta: string; texto: string }>(pedir, `/api/archivo?ruta=${encodeURIComponent(ruta)}`),
    guardarArchivo: (ruta: string, texto: string) => llamar<{ ok: true }>(pedir, "/api/archivo", { ruta, texto }),
    crearCarpeta: (ruta: string) => llamar<{ ok: true }>(pedir, "/api/carpeta", { ruta }),
  };
}

export type Cliente = ReturnType<typeof crearCliente>;
