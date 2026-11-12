import type { EstadoAgente } from "../flujo";

export type Punto = { x: number; y: number };
export type Tramo = readonly Punto[];

const p = (x: number, y: number): Punto => ({ x, y });

/**
 * El camino del brief por los pasillos: un tramo por agente (de la papelería al 1, del 1 al 2… del 7 al 8).
 * Las líneas son: y=910 (pasillo de arriba), y=1750 (pasillo de abajo) y x=2660 (la bajada por el lobby).
 */
export const RUTA: readonly Tramo[] = [
  [p(450, 1040), p(450, 910), p(550, 910), p(550, 800)],
  [p(550, 800), p(550, 910), p(1430, 910), p(1430, 800)],
  [p(1430, 800), p(1430, 910), p(2310, 910), p(2310, 800)],
  [p(2310, 800), p(2310, 910), p(3190, 910), p(3190, 800)],
  [p(3190, 800), p(3190, 910), p(2660, 910), p(2660, 1750), p(550, 1750), p(550, 1860)],
  [p(550, 1860), p(550, 1750), p(1430, 1750), p(1430, 1860)],
  [p(1430, 1860), p(1430, 1750), p(2310, 1750), p(2310, 1860)],
  [p(2310, 1860), p(2310, 1750), p(2780, 1750), p(2780, 1760)],
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
