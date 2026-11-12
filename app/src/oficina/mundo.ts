import { AGENTES } from "../flujo";

export type Rect = { x: number; y: number; w: number; h: number };
export type TipoSala = "normal" | "vidrio";

export type Sala = {
  numero: number;
  comando: string;
  tipo: TipoSala;
  area: Rect;
  pizarra: Rect;
  /** El escritorio (o la mesa de reuniones en la sala de vidrio). Es lo que se toca para elegir al agente. */
  escritorio: Rect;
  /** Centro del torso del personaje sentado. */
  personaje: { x: number; y: number };
};

/** La casa es mucho más grande que una pantalla: se recorre moviendo la cámara o caminando por adentro. */
export const MUNDO = { ancho: 4000, alto: 2640 } as const;

/**
 * El plano va en tres franjas: las oficinas de arriba (y 160 a 800), el lobby (y 1020 a 1640) y las de
 * abajo (desde 1860). Entre medio quedan dos pasillos de 220 de ancho. La persona mide 52 (radio 26),
 * así que en 220 sobra aire para cruzarse con otra.
 */
export const LOBBY: Rect = { x: 800, y: 1020, w: 1980, h: 620 };
/** La papelería queda a la izquierda del lobby, pegada a él. */
export const PAPELERIA: Rect = { x: 140, y: 1040, w: 620, h: 560 };

/** El patio seco del este: se ve a través del vidrio de la sala de reuniones. Está a la intemperie. */
export const PATIO: Rect = { x: 3608, y: 1020, w: 310, h: 1480 };

export const CARTEL_CENTRAL = {
  titulo: "Spec-Driven Development",
  lema: "Ocho pasos, de la idea al trabajo revisado.",
  area: { x: 1100, y: 1230, w: 1100, h: 190 } as Rect,
} as const;

const ANCHO_SALA = 820;
const ALTO_SALA = 640;
const ARRIBA_Y = 160;
const ABAJO_Y = 1860;

function salaNormal(indice: number, x: number, y: number): Sala {
  return {
    numero: AGENTES[indice].numero,
    comando: AGENTES[indice].comando,
    tipo: "normal",
    area: { x, y, w: ANCHO_SALA, h: ALTO_SALA },
    pizarra: { x: x + 430, y: y + 40, w: 320, h: 110 },
    escritorio: { x: x + 150, y: y + 400, w: 470, h: 130 },
    personaje: { x: x + 410, y: y + 350 },
  };
}

function salaDeVidrio(indice: number, x: number, y: number): Sala {
  return {
    numero: AGENTES[indice].numero,
    comando: AGENTES[indice].comando,
    tipo: "vidrio",
    area: { x, y, w: ANCHO_SALA, h: 1480 },
    pizarra: { x: x + 180, y: y + 40, w: 360, h: 110 },
    // la mesa de reuniones hace de escritorio: es lo que se toca para elegir al agente
    escritorio: { x: x + 200, y: y + 620, w: 420, h: 280 },
    personaje: { x: x + 410, y: y + 600 },
  };
}

/** Salas 1 a 4 arriba, 5 a 7 abajo, y la 8 (review) como sala de vidrio a la derecha, sobre el patio. */
export const SALAS: readonly Sala[] = [
  salaNormal(0, 140, ARRIBA_Y),
  salaNormal(1, 1020, ARRIBA_Y),
  salaNormal(2, 1900, ARRIBA_Y),
  salaNormal(3, 2780, ARRIBA_Y),
  salaNormal(4, 140, ABAJO_Y),
  salaNormal(5, 1020, ABAJO_Y),
  salaNormal(6, 1900, ABAJO_Y),
  salaDeVidrio(7, 2780, 1020),
];

const PAPEL = { w: 44, h: 30 } as const;

/** Dónde queda el brief cuando lo tiene el agente de esta sala: sobre su escritorio (o la mesa). */
export function rectBrief(sala: Sala): Rect {
  const e = sala.escritorio;
  return sala.tipo === "vidrio"
    ? { x: e.x + e.w / 2 + 40, y: e.y + 60, ...PAPEL }
    : { x: e.x + e.w / 2 + 62, y: e.y + 18, ...PAPEL };
}

/** Dónde queda el documento que deja el agente al terminar. Es lo que se toca para leerlo. */
export function rectDocumento(sala: Sala): Rect {
  const e = sala.escritorio;
  return sala.tipo === "vidrio"
    ? { x: e.x + e.w / 2 - 84, y: e.y + 60, ...PAPEL }
    : { x: e.x + e.w / 2 - 106, y: e.y + 18, ...PAPEL };
}

/** La puerta de la sala: abajo en las de arriba, arriba en las de abajo y a la izquierda en la de vidrio. */
export function puertaDeSala(sala: Sala): { x: number; y: number } {
  const a = sala.area;
  if (sala.tipo === "vidrio") return { x: a.x, y: a.y + a.h / 2 };
  return { x: a.x + a.w / 2, y: a.y < LOBBY.y ? a.y + a.h : a.y };
}
