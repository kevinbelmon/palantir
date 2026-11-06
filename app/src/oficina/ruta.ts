import type { EstadoAgente } from "../flujo";

export type Punto = { x: number; y: number };
export type Tramo = readonly Punto[];

const p = (x: number, y: number): Punto => ({ x, y });

/**
 * El camino del brief por los pasillos: un tramo por agente (de la papelería al 1, del 1 al 2… del 7 al 8).
 * Los pasillos son: y=540 arriba, y=1030 y y=1050 abajo (dos carriles) y x=1880 a la derecha del lobby.
 */
export const RUTA: readonly Tramo[] = [
  [p(310, 580), p(310, 540), p(380, 540), p(380, 520)],
  [p(380, 520), p(380, 540), p(980, 540), p(980, 520)],
  [p(980, 520), p(980, 540), p(1580, 540), p(1580, 520)],
  [p(1580, 520), p(1580, 540), p(2180, 540), p(2180, 520)],
  [p(2180, 520), p(2180, 540), p(1880, 540), p(1880, 1030), p(380, 1030), p(380, 1060)],
  [p(380, 1060), p(380, 1050), p(980, 1050), p(980, 1060)],
  [p(980, 1060), p(980, 1050), p(1580, 1050), p(1580, 1060)],
  [p(1580, 1060), p(1580, 1050), p(1890, 1050), p(1890, 1030), p(1900, 1030)],
];

export type EstadoTramo = "pendiente" | "activo" | "hecho";

/** El tramo `i` lleva al agente `i`: pendiente hasta que se habilita, activo mientras espera o trabaja, hecho al terminar. */
export function estadoDeSegmento(i: number, agentes: readonly EstadoAgente[]): EstadoTramo {
  const a = agentes[i];
  if (a === "terminado") return "hecho";
  if (a === "habilitado" || a === "corriendo") return "activo";
  return "pendiente";
}

export function longitudDeSegmento(tramo: Tramo): number {
  let total = 0;
  for (let i = 1; i < tramo.length; i++) total += Math.hypot(tramo[i].x - tramo[i - 1].x, tramo[i].y - tramo[i - 1].y);
  return total;
}

/** El punto que está a la fracción `f` (0 a 1) del largo del tramo, doblando en las esquinas. */
export function puntoEnRuta(tramo: Tramo, f: number): Punto {
  const objetivo = Math.min(1, Math.max(0, f)) * longitudDeSegmento(tramo);
  let recorrido = 0;
  for (let i = 1; i < tramo.length; i++) {
    const largo = Math.hypot(tramo[i].x - tramo[i - 1].x, tramo[i].y - tramo[i - 1].y);
    if (recorrido + largo >= objetivo) {
      const k = largo === 0 ? 0 : (objetivo - recorrido) / largo;
      return { x: tramo[i - 1].x + (tramo[i].x - tramo[i - 1].x) * k, y: tramo[i - 1].y + (tramo[i].y - tramo[i - 1].y) * k };
    }
    recorrido += largo;
  }
  return tramo[tramo.length - 1];
}
