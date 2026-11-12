import { LOBBY, PATIO, type Rect, type Sala, SALAS } from "../oficina";

// Dónde va el mobiliario de «mansión». Lo usan el dibujo en 3D y las colisiones, así lo que se ve es lo que se choca.

const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

export type Mueble = { x: number; z: number; giro: number };
export type Asiento = Mueble & { ancho: number; fondo: number };

/** Columnas de hormigón alineadas al borde norte del lobby, lejos de las puertas de las oficinas. */
export const COLUMNAS: readonly { x: number; z: number }[] = [1000, 1200, 1650, 1950, 2600].map((x) => ({ x, z: 1080 }));
export const RADIO_COLUMNA = 30;

/** El mostrador de recepción: un bloque de piedra en el lobby. La recepcionista atiende del lado de adentro. */
export const RECEPCION: Rect = rect(1420, 1470, 420, 70);

/**
 * Dos rincones de estar, uno contra cada pared lateral del lobby (la de la papelería y la del vidrio),
 * con su sillón largo, su mesa ratona y su lámpara de pie. El respaldo queda a menos de 8 de la pared.
 */
export const SOFAS_LOBBY: readonly Asiento[] = [
  { x: 2730, z: 1200, giro: -Math.PI / 2, ancho: 230, fondo: 84 },
  { x: 812, z: 1240, giro: Math.PI / 2, ancho: 230, fondo: 84 },
];
/** Las mesas ratonas, delante de cada sillón. Mismo orden que `SOFAS_LOBBY`. */
export const MESAS_RATONAS: readonly Rect[] = [rect(2440, 1130, 110, 130), rect(880, 1170, 110, 130)];
export const LAMPARAS_LOBBY: readonly { x: number; z: number }[] = [
  { x: 2726, z: 1330 },
  { x: 822, z: 1390 },
];
export const ARAÑA_LOBBY = { x: LOBBY.x + LOBBY.w / 2, z: LOBBY.y + LOBBY.h / 2 };

/** El patio seco del este: un árbol y un banco de piedra, con canteros que lo separan del pasillo. */
export const ARBOL_PATIO = { x: PATIO.x + 150, z: PATIO.y + 360 };
export const BANCO_PATIO: Rect = rect(PATIO.x + 246, PATIO.y + 280, 52, 320);
export const CANTEROS_PATIO: readonly Rect[] = [rect(PATIO.x, PATIO.y - 20, PATIO.w, 40), rect(PATIO.x, PATIO.y + PATIO.h - 20, PATIO.w, 40)];

export type MueblesDeSala = { sillon: Asiento; libreria: Mueble & { ancho: number }; lampara: { x: number; z: number } };

/**
 * Lo que lleva cada oficina además de su escritorio: un sillón de lectura contra la pared oeste, una
 * biblioteca contra la pared este y una lámpara de pie en el rincón del fondo. La sala de vidrio no lleva.
 */
export function mueblesDeSala(sala: Sala): MueblesDeSala | null {
  if (sala.tipo === "vidrio") return null;
  const a = sala.area;
  return {
    sillon: { x: a.x + 45, z: a.y + 470, giro: Math.PI / 2, ancho: 170, fondo: 74 },
    libreria: { x: a.x + a.w - 24, z: a.y + 300, giro: -Math.PI / 2, ancho: 110 },
    lampara: { x: a.x + a.w - 52, z: a.y + 40 },
  };
}

/** Lo que ocupa cada mueble en el plano (los sillones giran 90°, así que su ancho queda a lo largo de z). */
export function huellaDeAsiento(s: Asiento): Rect {
  return rect(s.x - s.fondo / 2, s.z - s.ancho / 2, s.fondo, s.ancho);
}

/** La biblioteca es una caja profunda 24, apoyada contra la pared. */
export function huellaDeLibreria(l: Mueble & { ancho: number }): Rect {
  return rect(l.x - 12, l.z - l.ancho / 2, 24, l.ancho);
}

export function huellasDeSala(sala: Sala): Rect[] {
  const m = mueblesDeSala(sala);
  if (!m) return [];
  return [huellaDeAsiento(m.sillon), huellaDeLibreria(m.libreria), rect(m.lampara.x - 15, m.lampara.z - 15, 30, 30)];
}

/** Todo el mobiliario que no se puede atravesar. */
export function obstaculosDeMuebles(): Rect[] {
  const lista: Rect[] = [...CANTEROS_PATIO, BANCO_PATIO, rect(ARBOL_PATIO.x - 30, ARBOL_PATIO.z - 30, 60, 60)];
  for (const c of COLUMNAS) lista.push(rect(c.x - RADIO_COLUMNA, c.z - RADIO_COLUMNA, RADIO_COLUMNA * 2, RADIO_COLUMNA * 2));
  lista.push(RECEPCION);
  for (const s of SOFAS_LOBBY) lista.push(huellaDeAsiento(s));
  lista.push(...MESAS_RATONAS);
  for (const l of LAMPARAS_LOBBY) lista.push(rect(l.x - 14, l.z - 14, 28, 28));
  for (const s of SALAS) lista.push(...huellasDeSala(s));
  return lista;
}
