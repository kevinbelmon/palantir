import { AGENTES, type EstadoAgente, type UbicacionBrief } from "./agentes";

export type Estado = {
  /** La persona ya dejó el brief en la papelería. */
  briefDejado: boolean;
  /** Estado de cada uno de los 8 agentes, en el orden del ciclo. */
  agentes: readonly EstadoAgente[];
  /** Qué agente tiene su documento abierto para leer, si hay alguno. */
  documentoAbierto: number | null;
  /** Se mira la pantalla final: ya se leyó el documento del último agente. */
  fin: boolean;
};

export type Accion =
  | { tipo: "dejarBrief" }
  | { tipo: "ordenarCorrer"; indice: number }
  | { tipo: "terminarCorrida"; indice: number }
  | { tipo: "abrirDocumento"; indice: number }
  | { tipo: "cerrarDocumento" }
  | { tipo: "reiniciar" };

/** Cuánto trabaja un agente antes de terminar: lo justo para leer su globito. */
export const DURACION_CORRIDA_MS = 4500;

export const ESTADO_INICIAL: Estado = {
  briefDejado: false,
  agentes: AGENTES.map(() => "deshabilitado"),
  documentoAbierto: null,
  fin: false,
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
    case "terminarCorrida": {
      const terminado = cambiar(e, a.indice, "corriendo", "terminado");
      if (terminado === e) return e;
      // el brief pasa al siguiente agente: solo ese se habilita, y espera la orden
      return cambiar(terminado, a.indice + 1, "deshabilitado", "habilitado");
    }
    case "abrirDocumento":
      return e.agentes[a.indice] === "terminado" ? { ...e, documentoAbierto: a.indice } : e;
    case "cerrarDocumento": {
      if (e.documentoAbierto === null) return e;
      // al cerrar el documento del último agente, con todos terminados, termina el recorrido
      const ultimo = e.agentes.length - 1;
      const recorridoCompleto = e.documentoAbierto === ultimo && e.agentes.every((x) => x === "terminado");
      return { ...e, documentoAbierto: null, fin: recorridoCompleto };
    }
    case "reiniciar":
      return ESTADO_INICIAL;
  }
}

/** Cuántos agentes terminaron y cuál es el que sigue (`null` si todavía no hay brief o ya terminaron todos). */
export function progreso(e: Estado): { hechos: number; total: number; actual: number | null } {
  const total = e.agentes.length;
  const hechos = e.agentes.filter((a) => a === "terminado").length;
  const actual = e.briefDejado && hechos < total ? e.agentes.findIndex((a) => a !== "terminado") : null;
  return { hechos, total, actual };
}

/** Lo que muestra el dock: cuántas tareas faltan y si a la persona le toca hacer algo. */
export function resumenDock(e: Estado): { tareas: number; teToca: number } {
  const tareas = e.agentes.filter((a) => a !== "terminado").length;
  const teToca = !e.briefDejado || e.agentes.some((a) => a === "habilitado") ? 1 : 0;
  return { tareas, teToca };
}

/** Dónde está el brief ahora: en la mano, en la papelería, o en el escritorio de quien lo tiene. */
export function ubicacionBrief(e: Estado): UbicacionBrief {
  if (!e.briefDejado) return "mano";
  const actual = e.agentes.findIndex((a) => a !== "terminado");
  if (actual === -1) return { agente: e.agentes.length - 1 };
  if (actual === 0 && e.agentes[0] === "habilitado") return "papeleria";
  return { agente: actual };
}
