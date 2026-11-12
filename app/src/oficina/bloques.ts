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
 * La pared que sigue sobre el marco de la puerta: del dintel hasta el techo no puede quedar un hueco
 * abierto. Devuelve el rectángulo del hueco para que el 3D lo rellene ahí mismo (en la sala de vidrio
 * el relleno es de vidrio, así la fachada sigue pareja).
 */
export function rellenoSobrePuerta(area: Rect, puerta: "abajo" | "arriba" | "izquierda", hueco = 130, g = 16): Rect {
  if (puerta === "izquierda") {
    const cz = area.y + area.h / 2;
    return { x: area.x - g / 2, y: cz - hueco / 2, w: g, h: hueco };
  }
  return {
    x: area.x + (area.w - hueco) / 2,
    y: puerta === "arriba" ? area.y - g / 2 : area.y + area.h - g / 2,
    w: hueco,
    h: g,
  };
}

const seCruzan = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Un rectángulo con agujeros adentro (por ejemplo, el techo con el atrio del lobby y el patio abiertos).
 * Devuelve los rectángulos que quedan, sin solaparse entre sí.
 */
export function restarRectes(base: Rect, huecos: readonly Rect[]): Rect[] {
  let resto: Rect[] = [base];
  for (const h of huecos) {
    const siguiente: Rect[] = [];
    for (const r of resto) {
      if (!seCruzan(r, h)) {
        siguiente.push(r);
        continue;
      }
      const arriba = Math.max(r.y, h.y);
      const abajo = Math.min(r.y + r.h, h.y + h.h);
      if (h.y > r.y) siguiente.push({ x: r.x, y: r.y, w: r.w, h: h.y - r.y });
      if (h.y + h.h < r.y + r.h) siguiente.push({ x: r.x, y: h.y + h.h, w: r.w, h: r.y + r.h - (h.y + h.h) });
      if (abajo > arriba) {
        if (h.x > r.x) siguiente.push({ x: r.x, y: arriba, w: h.x - r.x, h: abajo - arriba });
        if (h.x + h.w < r.x + r.w) siguiente.push({ x: h.x + h.w, y: arriba, w: r.x + r.w - (h.x + h.w), h: abajo - arriba });
      }
    }
    resto = siguiente;
  }
  return resto;
}

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
