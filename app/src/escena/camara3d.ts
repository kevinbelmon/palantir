import { MUNDO, type Rect, type Sala } from "../oficina";

/** Visión vertical de la cámara (la misma que usa el dibujo en 3D). */
export const FOV_VERTICAL = (38 * Math.PI) / 180;
/** Inclinación fija: la cámara mira desde arriba y desde el sur, como en una maqueta. */
export const INCLINACION = 0.92;

/**
 * La cámara orbita un punto del piso (`x`, `z`). En el mundo, `x` va hacia la derecha, `z` hacia el
 * sur (abajo en el plano de la oficina) e `y` hacia arriba.
 */
export type Camara3D = { x: number; z: number; distancia: number; inclinacion: number; giro: number };
export type Punto3D = { x: number; y: number; z: number };
export type VistaPantalla = { ancho: number; alto: number };

// Alto de la barra de arriba y del dock de abajo, por defecto (la pantalla los pasa explícitos).
const MARGEN_SUPERIOR = 64;
const MARGEN_INFERIOR = 96;

const resta = (a: Punto3D, b: Punto3D): Punto3D => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const punto = (a: Punto3D, b: Punto3D) => a.x * b.x + a.y * b.y + a.z * b.z;
const cruz = (a: Punto3D, b: Punto3D): Punto3D => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const normalizar = (a: Punto3D): Punto3D => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
const entre = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function posicionDeCamara(c: Camara3D): Punto3D {
  const horizontal = Math.cos(c.inclinacion) * c.distancia;
  return { x: c.x + Math.sin(c.giro) * horizontal, y: Math.sin(c.inclinacion) * c.distancia, z: c.z + Math.cos(c.giro) * horizontal };
}

function ejes(c: Camara3D) {
  const pos = posicionDeCamara(c);
  const f = normalizar(resta({ x: c.x, y: 0, z: c.z }, pos));
  const r = normalizar(cruz(f, { x: 0, y: 1, z: 0 }));
  const u = cruz(r, f);
  return { pos, f, r, u };
}

/** Dónde cae en la pantalla un punto del mundo. */
export function proyectar(c: Camara3D, vista: VistaPantalla, p: Punto3D): { x: number; y: number } {
  const { pos, f, r, u } = ejes(c);
  const v = resta(p, pos);
  const t = Math.tan(FOV_VERTICAL / 2);
  const cz = punto(v, f);
  const ndcX = punto(v, r) / (cz * t * (vista.ancho / vista.alto));
  const ndcY = punto(v, u) / (cz * t);
  return { x: (ndcX * 0.5 + 0.5) * vista.ancho, y: (0.5 - ndcY * 0.5) * vista.alto };
}

/** Qué punto del piso hay bajo un pixel de la pantalla (`null` si el pixel mira al cielo). */
export function pantallaAPlano(c: Camara3D, vista: VistaPantalla, px: number, py: number): { x: number; z: number } | null {
  const { pos, f, r, u } = ejes(c);
  const t = Math.tan(FOV_VERTICAL / 2);
  const ndcX = (px / vista.ancho) * 2 - 1;
  const ndcY = 1 - (py / vista.alto) * 2;
  const a = ndcX * t * (vista.ancho / vista.alto);
  const b = ndcY * t;
  const dir = { x: f.x + r.x * a + u.x * b, y: f.y + r.y * a + u.y * b, z: f.z + r.z * a + u.z * b };
  if (dir.y >= -1e-9) return null;
  const s = -pos.y / dir.y;
  return { x: pos.x + dir.x * s, z: pos.z + dir.z * s };
}

const dentroDelMundo = (c: Camara3D): Camara3D => ({ ...c, x: entre(c.x, 0, MUNDO.ancho), z: entre(c.z, 0, MUNDO.alto) });

/**
 * Una cámara que muestra un rectángulo del piso entero, centrado entre la barra de arriba y el dock
 * de abajo. `aire` es la fracción de la zona visible que ocupa (menos de 1 deja espacio alrededor).
 */
function encuadrar(rect: Rect, vista: VistaPantalla, superior: number, inferior: number, aire: number): Camara3D {
  const esquinas = [[rect.x, rect.y], [rect.x + rect.w, rect.y], [rect.x + rect.w, rect.y + rect.h], [rect.x, rect.y + rect.h]];
  const util = { y0: superior, y1: vista.alto - inferior };
  const anchoUtil = (util.y1 - util.y0) * aire;
  const alto = { y0: (util.y0 + util.y1) / 2 - anchoUtil / 2, y1: (util.y0 + util.y1) / 2 + anchoUtil / 2 };
  const x0 = (vista.ancho * (1 - aire)) / 2;
  const x1 = vista.ancho - x0;
  const proyectadas = (c: Camara3D) => esquinas.map(([x, z]) => proyectar(c, vista, { x, y: 0, z }));
  const cabe = (c: Camara3D) => proyectadas(c).every((s) => s.x >= x0 && s.x <= x1 && s.y >= alto.y0 && s.y <= alto.y1);

  let c: Camara3D = { x: rect.x + rect.w / 2, z: rect.y + rect.h / 2, distancia: 300, inclinacion: INCLINACION, giro: 0 };
  for (let i = 0; i < 600 && !cabe(c); i++) c = { ...c, distancia: c.distancia * 1.012 };

  // centrar en vertical dentro de la zona visible
  for (let i = 0; i < 8; i++) {
    const ys = proyectadas(c).map((s) => s.y);
    const delta = (util.y0 + util.y1) / 2 - (Math.min(...ys) + Math.max(...ys)) / 2;
    if (Math.abs(delta) < 0.3) break;
    const s0 = proyectar(c, vista, { x: c.x, y: 0, z: c.z }).y;
    const s1 = proyectar(c, vista, { x: c.x, y: 0, z: c.z + 10 }).y;
    c = { ...c, z: c.z - delta / ((s1 - s0) / 10) };
  }
  return c;
}

/** La vista de toda la oficina. */
export function camara3dInicial(vista: VistaPantalla, superior = MARGEN_SUPERIOR, inferior = MARGEN_INFERIOR): Camara3D {
  return encuadrar({ x: 0, y: 0, w: MUNDO.ancho, h: MUNDO.alto }, vista, superior, inferior, 0.97);
}

/** La cámara que va a una sala: se ve entera, con aire alrededor. */
export function camara3dEnSala(sala: Sala, vista: VistaPantalla, superior = MARGEN_SUPERIOR, inferior = MARGEN_INFERIOR): Camara3D {
  return encuadrar(sala.area, vista, superior, inferior, 0.9);
}

/** Lo más cerca (se lee una sala chica) y lo más lejos (se ve todo y un poco más) que puede estar la cámara. */
export function limitesDistancia(vista: VistaPantalla): { min: number; max: number } {
  const todo = camara3dInicial(vista).distancia;
  const sala = encuadrar({ x: 0, y: 0, w: 560, h: 420 }, vista, MARGEN_SUPERIOR, MARGEN_INFERIOR, 0.9).distancia;
  return { min: sala * 0.7, max: todo * 1.1 };
}

/** Arrastrar con el clic derecho: el punto del piso que estaba bajo el mouse lo sigue. */
export function arrastrar3d(c: Camara3D, dx: number, dy: number, vista: VistaPantalla, px: number, py: number): Camara3D {
  const desde = pantallaAPlano(c, vista, px, py);
  const hasta = pantallaAPlano(c, vista, px + dx, py + dy);
  if (!desde || !hasta) return c;
  return dentroDelMundo({ ...c, x: c.x + (desde.x - hasta.x), z: c.z + (desde.z - hasta.z) });
}

/** Zoom con la rueda: el punto del piso bajo el mouse se queda donde está. `factor` menor que 1 acerca. */
export function zoom3d(c: Camara3D, factor: number, vista: VistaPantalla, px: number, py: number): Camara3D {
  const { min, max } = limitesDistancia(vista);
  const nueva = { ...c, distancia: entre(c.distancia * factor, min, max) };
  const antes = pantallaAPlano(c, vista, px, py);
  const despues = pantallaAPlano(nueva, vista, px, py);
  if (!antes || !despues) return nueva;
  return dentroDelMundo({ ...nueva, x: nueva.x + (antes.x - despues.x), z: nueva.z + (antes.z - despues.z) });
}

/** Un punto del viaje entre dos cámaras (`k` de 0 a 1), suave al salir y al llegar. */
export function interpolar3d(a: Camara3D, b: Camara3D, k: number): Camara3D {
  const t = entre(k, 0, 1);
  const e = t * t * (3 - 2 * t);
  return {
    x: a.x + (b.x - a.x) * e,
    z: a.z + (b.z - a.z) * e,
    distancia: a.distancia + (b.distancia - a.distancia) * e,
    inclinacion: a.inclinacion + (b.inclinacion - a.inclinacion) * e,
    giro: a.giro + (b.giro - a.giro) * e,
  };
}
