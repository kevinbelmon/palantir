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

export type LadoDeMuro = "norte" | "sur" | "oeste" | "este";
export type TiraDeMuro = { lado: LadoDeMuro; rect: Rect };

/**
 * Las tiras de pared de una sala, centradas sobre su borde, con un hueco de 130 en el lado de la
 * puerta (`abajo` = sur, `arriba` = norte, `izquierda` = oeste). Las usan el dibujo 2D y el 3D.
 */
export function tirasDeMuro(a: Rect, puerta: "abajo" | "arriba" | "izquierda", g = 16, hueco = 130): TiraDeMuro[] {
  const tiras: TiraDeMuro[] = [];
  const agregar = (lado: LadoDeMuro, x: number, y: number, w: number, h: number) => tiras.push({ lado, rect: { x, y, w, h } });
  const mitad = (a.w - hueco) / 2 + g / 2;
  const mitadV = (a.h - hueco) / 2 + g / 2;
  // norte
  if (puerta === "arriba") {
    agregar("norte", a.x - g / 2, a.y - g / 2, mitad, g);
    agregar("norte", a.x + (a.w + hueco) / 2, a.y - g / 2, mitad, g);
  } else agregar("norte", a.x - g / 2, a.y - g / 2, a.w + g, g);
  // sur
  if (puerta === "abajo") {
    agregar("sur", a.x - g / 2, a.y + a.h - g / 2, mitad, g);
    agregar("sur", a.x + (a.w + hueco) / 2, a.y + a.h - g / 2, mitad, g);
  } else agregar("sur", a.x - g / 2, a.y + a.h - g / 2, a.w + g, g);
  // oeste
  if (puerta === "izquierda") {
    agregar("oeste", a.x - g / 2, a.y - g / 2, g, mitadV);
    agregar("oeste", a.x - g / 2, a.y + (a.h + hueco) / 2, g, mitadV);
  } else agregar("oeste", a.x - g / 2, a.y - g / 2, g, a.h + g);
  // este
  agregar("este", a.x + a.w - g / 2, a.y - g / 2, g, a.h + g);
  return tiras;
}
