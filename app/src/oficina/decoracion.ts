import { LOBBY, SALAS, type Rect } from "./mundo";

export type Planta = { x: number; y: number };

const salaReview = SALAS[7];

/** Plantas: dos en cada sala chica, tres en la de vidrio y una en cada esquina del lobby. */
export const PLANTAS: readonly Planta[] = [
  ...SALAS.slice(0, 7).flatMap((s) => [
    { x: s.area.x + 55, y: s.area.y + s.area.h - 45 },
    { x: s.area.x + s.area.w - 50, y: s.area.y + s.area.h - 70 },
  ]),
  { x: salaReview.area.x + 55, y: salaReview.area.y + 830 },
  { x: salaReview.area.x + 505, y: salaReview.area.y + 830 },
  { x: salaReview.area.x + 60, y: salaReview.area.y + 200 },
  { x: LOBBY.x + 60, y: LOBBY.y + 70 },
  { x: LOBBY.x + LOBBY.w - 60, y: LOBBY.y + 70 },
  { x: LOBBY.x + 60, y: LOBBY.y + LOBBY.h - 60 },
  { x: LOBBY.x + LOBBY.w - 60, y: LOBBY.y + LOBBY.h - 60 },
];

export const SILLON: Rect = { x: 700, y: 935, w: 260, h: 65 };
export const BEBEDERO: Rect = { x: 1730, y: 650, w: 50, h: 90 };

/** Mesa redonda de la sala de reuniones del review (centro y radios). */
export const MESA_REDONDA_REVIEW = { x: salaReview.area.x + 280, y: salaReview.area.y + 520, rx: 150, ry: 100 } as const;

/** Colegas sentados alrededor de la mesa (el agente del review está arriba). `indice` elige su aspecto. */
export const COLEGAS_REVIEW: readonly { x: number; y: number; indice: number }[] = [
  { x: salaReview.area.x + 90, y: salaReview.area.y + 520, indice: 1 },
  { x: salaReview.area.x + 470, y: salaReview.area.y + 520, indice: 3 },
  { x: salaReview.area.x + 280, y: salaReview.area.y + 700, indice: 5 },
];
