import { PAPELERIA, rectDocumento, SALAS, type Rect } from "./mundo";

/** Lo que se puede tocar en la oficina. */
export type Elemento = { tipo: "papeleria" } | { tipo: "agente"; indice: number } | { tipo: "documento"; indice: number };

const dentro = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/** La mesa de la papelería, donde se deja el brief. */
const MESA_PAPELERIA: Rect = { x: PAPELERIA.x + 60, y: PAPELERIA.y + 150, w: 300, h: 190 };

/** Qué hay en un punto del mundo: la papelería, el documento de un agente, un agente (su escritorio o su personaje), o nada. */
export function elementoEn(x: number, y: number): Elemento | null {
  if (dentro(MESA_PAPELERIA, x, y)) return { tipo: "papeleria" };
  for (let i = 0; i < SALAS.length; i++) {
    const s = SALAS[i];
    if (dentro(rectDocumento(s), x, y)) return { tipo: "documento", indice: i };
    const escritorio: Rect = { x: s.escritorio.x - 10, y: s.escritorio.y - 60, w: s.escritorio.w + 20, h: s.escritorio.h + 70 };
    const personaje: Rect = { x: s.personaje.x - 45, y: s.personaje.y - 95, w: 90, h: 135 };
    if (dentro(escritorio, x, y) || dentro(personaje, x, y)) return { tipo: "agente", indice: i };
  }
  return null;
}
