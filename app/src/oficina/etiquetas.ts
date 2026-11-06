import type { Rect, Sala } from "./mundo";

/** El lugar de la etiqueta con el comando, flotando justo arriba de la cabeza del personaje. */
export function posicionEtiqueta(sala: Sala): Rect {
  const w = 128;
  const h = 26;
  return { x: sala.personaje.x - w / 2, y: sala.personaje.y - 114, w, h };
}
