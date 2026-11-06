import type { Rect } from "./mundo";

/** Centros de los tacos de una grilla de casilleros de `paso` píxeles dentro del área (fila por fila). */
export function tacosEn(area: Rect, paso: number): { x: number; y: number }[] {
  if (!(paso > 0)) return [];
  const columnas = Math.floor(area.w / paso);
  const filas = Math.floor(area.h / paso);
  const tacos: { x: number; y: number }[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      tacos.push({ x: area.x + c * paso + paso / 2, y: area.y + f * paso + paso / 2 });
    }
  }
  return tacos;
}

/**
 * Ladrillos de una pared, por hiladas: cada hilada cubre el ancho justo y la siguiente arranca con
 * medio ladrillo, como en una pared de verdad.
 */
export function ladrillosEn(pared: Rect, alto: number, largo: number): Rect[] {
  if (!(alto > 0) || !(largo > 0)) return [];
  const hiladas = Math.floor(pared.h / alto);
  const ladrillos: Rect[] = [];
  for (let h = 0; h < hiladas; h++) {
    const y = pared.y + h * alto;
    let x = pared.x;
    let ancho = h % 2 === 0 ? largo : largo / 2;
    while (x < pared.x + pared.w - 0.001) {
      const w = Math.min(ancho, pared.x + pared.w - x);
      ladrillos.push({ x, y, w, h: alto });
      x += w;
      ancho = largo;
    }
  }
  return ladrillos;
}
