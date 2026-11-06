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

/** La oficina es más grande que una pantalla: se recorre moviendo la cámara. */
export const MUNDO = { ancho: 2600, alto: 1600 } as const;

export const LOBBY: Rect = { x: 560, y: 560, w: 1300, h: 460 };
export const PAPELERIA: Rect = { x: 100, y: 580, w: 420, h: 420 };

export const CARTEL_CENTRAL = {
  titulo: "Spec-Driven Development",
  lema: "Planear primero. Construir después.",
  area: { x: 810, y: 740, w: 800, h: 150 } as Rect,
} as const;

const ANCHO_SALA = 560;
const ALTO_SALA = 420;
const ARRIBA_Y = 100;
const ABAJO_Y = 1060;

function salaNormal(indice: number, x: number, y: number): Sala {
  return {
    numero: AGENTES[indice].numero,
    comando: AGENTES[indice].comando,
    tipo: "normal",
    area: { x, y, w: ANCHO_SALA, h: ALTO_SALA },
    pizarra: { x: x + 290, y: y + 30, w: 230, h: 84 },
    escritorio: { x: x + 120, y: y + 250, w: 320, h: 100 },
    personaje: { x: x + 280, y: y + 215 },
  };
}

function salaDeVidrio(indice: number, x: number, y: number): Sala {
  return {
    numero: AGENTES[indice].numero,
    comando: AGENTES[indice].comando,
    tipo: "vidrio",
    area: { x, y, w: ANCHO_SALA, h: 900 },
    pizarra: { x: x + 150, y: y + 30, w: 260, h: 84 },
    escritorio: { x: x + 130, y: y + 420, w: 300, h: 200 },
    personaje: { x: x + 280, y: y + 400 },
  };
}

/** Salas 1 a 4 arriba, 5 a 7 abajo, y la 8 (review) como sala de vidrio a la derecha. */
export const SALAS: readonly Sala[] = [
  salaNormal(0, 100, ARRIBA_Y),
  salaNormal(1, 700, ARRIBA_Y),
  salaNormal(2, 1300, ARRIBA_Y),
  salaNormal(3, 1900, ARRIBA_Y),
  salaNormal(4, 100, ABAJO_Y),
  salaNormal(5, 700, ABAJO_Y),
  salaNormal(6, 1300, ABAJO_Y),
  salaDeVidrio(7, 1900, 580),
];

const PAPEL = { w: 44, h: 30 } as const;

/** Dónde queda el brief cuando lo tiene el agente de esta sala: sobre su escritorio (o la mesa). */
export function rectBrief(sala: Sala): Rect {
  const e = sala.escritorio;
  return sala.tipo === "vidrio"
    ? { x: e.x + e.w / 2 + 30, y: e.y + 34, ...PAPEL }
    : { x: e.x + e.w / 2 + 52, y: e.y + 2, ...PAPEL };
}

/** Dónde queda el documento que deja el agente al terminar. Es lo que se toca para leerlo. */
export function rectDocumento(sala: Sala): Rect {
  const e = sala.escritorio;
  return sala.tipo === "vidrio"
    ? { x: e.x + e.w / 2 - 74, y: e.y + 34, ...PAPEL }
    : { x: e.x + e.w / 2 - 100, y: e.y + 2, ...PAPEL };
}

/** La puerta de la sala: abajo en las de arriba, arriba en las de abajo y a la izquierda en la de vidrio. */
export function puertaDeSala(sala: Sala): { x: number; y: number } {
  const a = sala.area;
  if (sala.tipo === "vidrio") return { x: a.x, y: a.y + a.h / 2 };
  return { x: a.x + a.w / 2, y: a.y < LOBBY.y ? a.y + a.h : a.y };
}
