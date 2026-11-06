/** Un parpadeo corto cada unos 4 segundos, en un momento distinto para cada agente. Quieto si el tiempo es 0. */
export function parpadeo(t: number, indice: number): boolean {
  if (t <= 0) return false;
  const periodo = 4;
  return (t + indice * 1.7) % periodo < 0.14;
}

/** Cuánto sube o baja el pecho al respirar, en píxeles (entre -2 y 2), a un ritmo distinto por agente. */
export function respiracion(t: number, indice: number): number {
  return Math.sin(t * 1.6 + indice * 0.9) * 2;
}

/** Si el sistema pide menos movimiento, el tiempo se congela en 0 y nada se anima. */
export function tiempoVisible(t: number, reducido: boolean): number {
  return reducido ? 0 : t;
}
