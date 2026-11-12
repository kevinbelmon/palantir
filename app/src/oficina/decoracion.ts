import { LOBBY, PAPELERIA, SALAS, type Rect } from "./mundo";

export type Planta = { x: number; y: number };

const salaReview = SALAS[7];

/** Plantas: dos en cada sala chica, tres en la de vidrio y una en cada esquina del lobby. */
export const PLANTAS: readonly Planta[] = [
  ...SALAS.slice(0, 7).flatMap((s) => [
    { x: s.area.x + 34, y: s.area.y + s.area.h - 34 },
    { x: s.area.x + s.area.w - 34, y: s.area.y + s.area.h - 34 },
  ]),
  { x: salaReview.area.x + 55, y: salaReview.area.y + 870 },
  { x: salaReview.area.x + 505, y: salaReview.area.y + 870 },
  { x: salaReview.area.x + 60, y: salaReview.area.y + 200 },
  { x: LOBBY.x + 60, y: LOBBY.y + 70 },
  { x: LOBBY.x + LOBBY.w - 60, y: LOBBY.y + 70 },
  { x: LOBBY.x + 60, y: LOBBY.y + LOBBY.h - 60 },
  { x: LOBBY.x + LOBBY.w - 60, y: LOBBY.y + LOBBY.h - 60 },
];

/** La estantería de la papelería: contra la pared de la izquierda, para dejar libre la entrada. */
export const ESTANTE_PAPELERIA: Rect = { x: PAPELERIA.x + 15, y: PAPELERIA.y + 20, w: 130, h: 50 };
/** El bebedero: contra la pared de la sala de vidrio (que está en x 1892). */
export const BEBEDERO: Rect = { x: 1832, y: 750, w: 50, h: 90 };

/** Mesa redonda de la sala de reuniones del review (centro y radios). */
export const MESA_REDONDA_REVIEW = { x: salaReview.area.x + 280, y: salaReview.area.y + 520, rx: 150, ry: 100 } as const;

/** Colegas sentados alrededor de la mesa (el agente del review está arriba). `indice` elige su aspecto. */
export const COLEGAS_REVIEW: readonly { x: number; y: number; indice: number }[] = [
  { x: salaReview.area.x + 90, y: salaReview.area.y + 520, indice: 1 },
  { x: salaReview.area.x + 470, y: salaReview.area.y + 520, indice: 3 },
  { x: salaReview.area.x + 280, y: salaReview.area.y + 700, indice: 5 },
];

export type TipoObjeto = "papelero" | "libros" | "lupa" | "libreta" | "servidor" | "dispositivos" | "portapapeles" | "trofeo";
export type ObjetoSala = { sala: number; tipo: TipoObjeto; x: number; y: number; w: number; h: number };

const TIPOS_POR_SALA: readonly TipoObjeto[] = ["papelero", "libros", "lupa", "libreta", "servidor", "dispositivos", "portapapeles", "trofeo"];

/** Un objeto propio en cada sala, que cuenta qué hace su agente: el papelero de las ideas, el servidor de la construcción, el trofeo del final. */
export const OBJETOS_SALA: readonly ObjetoSala[] = SALAS.map((s, i) =>
  s.tipo === "vidrio"
    ? { sala: i, tipo: TIPOS_POR_SALA[i], x: s.area.x + 40, y: s.area.y + 230, w: 56, h: 110 }
    : { sala: i, tipo: TIPOS_POR_SALA[i], x: s.area.x + 34, y: s.area.y + 200, w: 52, h: 110 },
);
