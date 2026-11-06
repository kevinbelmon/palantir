import { AGENTES, type EstadoAgente, type UbicacionBrief } from "./agentes";

export type Estado = {
  /** La persona ya dejó el brief en la papelería. */
  briefDejado: boolean;
  /** Estado de cada uno de los 8 agentes, en el orden del ciclo. */
  agentes: readonly EstadoAgente[];
};

export type Accion = { tipo: "dejarBrief" };

export const ESTADO_INICIAL: Estado = {
  briefDejado: false,
  agentes: AGENTES.map(() => "deshabilitado"),
};

/** Cada acción devuelve un estado nuevo; nunca modifica el anterior. */
export function reducir(e: Estado, a: Accion): Estado {
  switch (a.tipo) {
    case "dejarBrief": {
      if (e.briefDejado) return e;
      return { ...e, briefDejado: true, agentes: e.agentes.map((estado, i) => (i === 0 ? "habilitado" : estado)) };
    }
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
