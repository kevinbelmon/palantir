import { MUNDO } from "./mundo";

/** `x` e `y` son el punto del mundo que está en la esquina superior izquierda de la pantalla. */
export type Camara = { x: number; y: number; zoom: number };
export type Vista = { ancho: number; alto: number };

const ZOOM_MAXIMO = 1.6;

/** Cámara que muestra toda la oficina, centrada, en una ventana de cualquier forma. Los márgenes dejan lugar para la barra de arriba y el dock de abajo. */
export function camaraAjustada(anchoVista: number, altoVista: number, margenSuperior = 0, margenInferior = 0): Camara {
  const altoUtil = altoVista - margenSuperior - margenInferior;
  const zoom = Math.min(anchoVista / MUNDO.ancho, altoUtil / MUNDO.alto) * 0.96;
  return {
    zoom,
    x: -(anchoVista / zoom - MUNDO.ancho) / 2,
    y: -(altoUtil / zoom - MUNDO.alto) / 2 - margenSuperior / zoom,
  };
}

/** Del más alejado (se ve todo, un poco más lejos que el ajuste) al más cercano (se lee cada pizarra). */
export function limitesZoom(anchoVista: number, altoVista: number): { min: number; max: number } {
  return { min: camaraAjustada(anchoVista, altoVista).zoom * 0.85, max: ZOOM_MAXIMO };
}

export function pantallaAMundo(c: Camara, px: number, py: number): { x: number; y: number } {
  return { x: c.x + px / c.zoom, y: c.y + py / c.zoom };
}

export function mundoAPantalla(c: Camara, wx: number, wy: number): { x: number; y: number } {
  return { x: (wx - c.x) * c.zoom, y: (wy - c.y) * c.zoom };
}

const entre = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Evita perder la oficina: el centro de la vista siempre queda dentro del mundo. */
function mantenerEnElMundo(c: Camara, v: Vista): Camara {
  const mitadAncho = v.ancho / (2 * c.zoom);
  const mitadAlto = v.alto / (2 * c.zoom);
  return {
    zoom: c.zoom,
    x: entre(c.x + mitadAncho, 0, MUNDO.ancho) - mitadAncho,
    y: entre(c.y + mitadAlto, 0, MUNDO.alto) - mitadAlto,
  };
}

/** Arrastrar con el clic derecho: el mapa sigue al mouse. `dx` y `dy` son píxeles de pantalla. */
export function arrastrar(c: Camara, dx: number, dy: number, v: Vista): Camara {
  return mantenerEnElMundo({ ...c, x: c.x - dx / c.zoom, y: c.y - dy / c.zoom }, v);
}

/** Zoom con la rueda: el punto bajo el mouse (`px`, `py`) se queda donde está. */
export function zoomEn(c: Camara, factor: number, px: number, py: number, v: Vista): Camara {
  const { min, max } = limitesZoom(v.ancho, v.alto);
  const zoom = entre(c.zoom * factor, min, max);
  const bajoElMouse = pantallaAMundo(c, px, py);
  return mantenerEnElMundo({ zoom, x: bajoElMouse.x - px / zoom, y: bajoElMouse.y - py / zoom }, v);
}

/** Cuánto acerca o aleja un giro de la rueda (`deltaY` negativo = hacia adelante = acerca). */
export function factorRueda(deltaY: number): number {
  return Math.exp(-deltaY * 0.0015);
}
