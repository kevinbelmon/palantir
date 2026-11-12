import { LOBBY, PAPELERIA, PATIO, SALAS, type Rect } from "./mundo";

export type Planta = { x: number; y: number };

const salaReview = SALAS[7];

/**
 * Plantas: dos en cada oficina (en las esquinas del fondo), tres en la sala de vidrio, cuatro en el
 * lobby pegadas a sus paredes y dos en el patio seco.
 */
export const PLANTAS: readonly Planta[] = [
  ...SALAS.slice(0, 7).flatMap((s) => [
    { x: s.area.x + 50, y: s.area.y + s.area.h - 50 },
    { x: s.area.x + s.area.w - 50, y: s.area.y + s.area.h - 50 },
  ]),
  { x: salaReview.area.x + 60, y: salaReview.area.y + 200 },
  { x: salaReview.area.x + 60, y: salaReview.area.y + 1350 },
  { x: salaReview.area.x + 760, y: salaReview.area.y + 1350 },
  { x: LOBBY.x + 70, y: LOBBY.y + 70 },
  { x: LOBBY.x + LOBBY.w - 70, y: LOBBY.y + 70 },
  { x: LOBBY.x + 70, y: LOBBY.y + LOBBY.h - 70 },
  { x: LOBBY.x + LOBBY.w - 70, y: LOBBY.y + LOBBY.h - 70 },
  { x: PATIO.x + 55, y: PATIO.y + 120 },
  { x: PATIO.x + 55, y: PATIO.y + 1360 },
];

/** La estantería de la papelería: contra la pared de la izquierda, para dejar libre la entrada. */
export const ESTANTE_PAPELERIA: Rect = { x: PAPELERIA.x + 20, y: PAPELERIA.y + 30, w: 180, h: 60 };
/** El bebedero: contra la pared de la sala de vidrio, en el tramo libre entre el sillón y la esquina. */
export const BEBEDERO: Rect = { x: 2712, y: 1420, w: 50, h: 90 };

/** La mesa de la papelería: lo que se toca para dejar el brief. Vive acá para que el dibujo y los choques no se desincronicen. */
export const MESA_PAPELERIA: Rect = { x: PAPELERIA.x + 100, y: PAPELERIA.y + 300, w: 420, h: 120 };

/** Mesa redonda de la sala de reuniones del review (centro y radios). */
export const MESA_REDONDA_REVIEW = { x: salaReview.area.x + 410, y: salaReview.area.y + 760, rx: 210, ry: 140 } as const;

/** Colegas sentados alrededor de la mesa (el agente del review está arriba). `indice` elige su aspecto. */
export const COLEGAS_REVIEW: readonly { x: number; y: number; indice: number }[] = [
  { x: salaReview.area.x + 130, y: salaReview.area.y + 760, indice: 1 },
  { x: salaReview.area.x + 690, y: salaReview.area.y + 760, indice: 3 },
  { x: salaReview.area.x + 410, y: salaReview.area.y + 1040, indice: 5 },
];

export type TipoObjeto = "papelero" | "libros" | "lupa" | "libreta" | "servidor" | "dispositivos" | "portapapeles" | "trofeo";
export type ObjetoSala = { sala: number; tipo: TipoObjeto; x: number; y: number; w: number; h: number };

const TIPOS_POR_SALA: readonly TipoObjeto[] = ["papelero", "libros", "lupa", "libreta", "servidor", "dispositivos", "portapapeles", "trofeo"];

/**
 * Un objeto propio en cada sala, que cuenta qué hace su agente: el papelero de las ideas, el servidor
 * de la construcción, el trofeo del final. Todos van contra la pared del fondo, nunca en el medio.
 */
export const OBJETOS_SALA: readonly ObjetoSala[] = SALAS.map((s, i) => ({
  sala: i,
  tipo: TIPOS_POR_SALA[i],
  x: s.area.x + 24,
  y: s.area.y + 24,
  w: 64,
  h: 110,
}));
