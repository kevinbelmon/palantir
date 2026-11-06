import { AGENTES, type EstadoAgente, type UbicacionBrief } from "./agentes";

export type Estado = {
  /** La persona ya dejó el brief en la papelería. */
  briefDejado: boolean;
  /** Estado de cada uno de los 8 agentes, en el orden del ciclo. */
  agentes: readonly EstadoAgente[];
  /** Qué agente tiene su documento abierto para leer, si hay alguno. */
  documentoAbierto: number | null;
};

export type Accion =
  | { tipo: "dejarBrief" }
  | { tipo: "ordenarCorrer"; indice: number }
  | { tipo: "terminarCorrida"; indice: number }
  | { tipo: "abrirDocumento"; indice: number }
  | { tipo: "cerrarDocumento" };

/** Cuánto trabaja un agente antes de terminar: lo justo para leer su globito. */
export const DURACION_CORRIDA_MS = 4500;

export const ESTADO_INICIAL: Estado = {
  briefDejado: false,
  agentes: AGENTES.map(() => "deshabilitado"),
  documentoAbierto: null,
};

function cambiar(e: Estado, indice: number, de: EstadoAgente, a: EstadoAgente): Estado {
  if (e.agentes[indice] !== de) return e;
  return { ...e, agentes: e.agentes.map((estado, i) => (i === indice ? a : estado)) };
}

/** Cada acción devuelve un estado nuevo; nunca modifica el anterior. Lo que no corresponde no hace nada. */
export function reducir(e: Estado, a: Accion): Estado {
  switch (a.tipo) {
    case "dejarBrief": {
      if (e.briefDejado) return e;
      return { ...e, briefDejado: true, agentes: e.agentes.map((estado, i) => (i === 0 ? "habilitado" : estado)) };
    }
    case "ordenarCorrer":
      return cambiar(e, a.indice, "habilitado", "corriendo");
    case "terminarCorrida":
      return cambiar(e, a.indice, "corriendo", "terminado");
    case "abrirDocumento":
      return e.agentes[a.indice] === "terminado" ? { ...e, documentoAbierto: a.indice } : e;
    case "cerrarDocumento":
      return e.documentoAbierto === null ? e : { ...e, documentoAbierto: null };
  }
}

/** Dónde está el brief ahora: en la mano, en la papelería, o en el escritorio de quien lo tiene. */
export function ubicacionBrief(e: Estado): UbicacionBrief {
  if (!e.briefDejado) return "mano";
  const actual = e.agentes.findIndex((a) => a !== "terminado");
  if (actual === -1) return { agente: e.agentes.length - 1 };
  if (actual === 0 && e.agentes[0] === "habilitado") return "papeleria";
  return { agente: actual };
}
