import { LOBBY, type Rect, type Sala, SALAS } from "../oficina";

// Dónde va el mobiliario de «mansión». Lo usan el dibujo en 3D y las colisiones, así lo que se ve es lo que se choca.

const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

export type Mueble = { x: number; z: number; giro: number };
export type Asiento = Mueble & { ancho: number; fondo: number };

/** Columnas de mármol a lo largo del borde norte del lobby, lejos de las puertas de las oficinas. */
export const COLUMNAS: readonly { x: number; z: number }[] = [800, 1130, 1400, 1700].map((x) => ({ x, z: 590 }));
export const RADIO_COLUMNA = 24;

/** Dos rincones de estar en el lobby, uno a cada lado, con su sillón de tres cuerpos, su mesa ratona y su lámpara de pie. */
export const SOFAS_LOBBY: readonly Asiento[] = [
  { x: 1770, z: 840, giro: -Math.PI / 2, ancho: 150, fondo: 62 },
  { x: 650, z: 820, giro: Math.PI / 2, ancho: 150, fondo: 62 },
];
export const MESAS_RATONAS: readonly Rect[] = [rect(1625, 795, 70, 90), rect(735, 775, 70, 90)];
export const LAMPARAS_LOBBY: readonly { x: number; z: number }[] = [
  { x: 1770, z: 940 },
  { x: 650, z: 935 },
];
export const ARAÑA_LOBBY = { x: LOBBY.x + LOBBY.w / 2, z: LOBBY.y + LOBBY.h / 2 };

export type MueblesDeSala = { sillon: Asiento; libreria: Mueble & { ancho: number }; lampara: { x: number; z: number } };

/** Lo que lleva cada oficina además de su escritorio: un sillón de lectura, una biblioteca contra la pared este y una lámpara de pie. La sala de vidrio no lleva. */
export function mueblesDeSala(sala: Sala): MueblesDeSala | null {
  if (sala.tipo === "vidrio") return null;
  const a = sala.area;
  return {
    sillon: { x: a.x + 44, z: a.y + 362, giro: Math.PI / 2, ancho: 90, fondo: 58 },
    libreria: { x: a.x + a.w - 22, z: a.y + 190, giro: -Math.PI / 2, ancho: 56 },
    lampara: { x: a.x + a.w - 41, z: a.y + 109 },
  };
}

/** Lo que ocupa cada mueble en el plano (los sillones giran 90°, así que su ancho queda a lo largo de z). */
export function huellaDeAsiento(s: Asiento): Rect {
  return rect(s.x - s.fondo / 2, s.z - s.ancho / 2, s.fondo, s.ancho);
}

export function huellasDeSala(sala: Sala): Rect[] {
  const m = mueblesDeSala(sala);
  if (!m) return [];
  const a = sala.area;
  return [huellaDeAsiento(m.sillon), rect(a.x + a.w - 36, m.libreria.z - m.libreria.ancho / 2, 28, m.libreria.ancho), rect(m.lampara.x - 15, m.lampara.z - 15, 30, 30)];
}

/** Todo el mobiliario nuevo que no se puede atravesar. */
export function obstaculosDeMuebles(): Rect[] {
  const lista: Rect[] = [];
  for (const c of COLUMNAS) lista.push(rect(c.x - RADIO_COLUMNA, c.z - RADIO_COLUMNA, RADIO_COLUMNA * 2, RADIO_COLUMNA * 2));
  for (const s of SOFAS_LOBBY) lista.push(huellaDeAsiento(s));
  lista.push(...MESAS_RATONAS);
  for (const l of LAMPARAS_LOBBY) lista.push(rect(l.x - 14, l.z - 14, 28, 28));
  for (const s of SALAS) lista.push(...huellasDeSala(s));
  return lista;
}
