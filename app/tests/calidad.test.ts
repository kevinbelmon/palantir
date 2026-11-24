import { describe, expect, it } from "vitest";
import { crearMedidorDeFps, EFECTOS_POR_NIVEL, FPS_MINIMO, NIVEL_MAXIMO, nivelSegunFps, PROPORCION_POR_NIVEL, SOMBRA_CADA_NIVEL } from "../src/escena/calidad";

describe("el regulador de calidad", () => {
  it("baja de a un nivel cuando los cuadros por segundo no alcanzan, y nunca sube solo", () => {
    expect(nivelSegunFps(0, 60)).toBe(0);
    expect(nivelSegunFps(0, FPS_MINIMO - 1)).toBe(1);
    expect(nivelSegunFps(1, 10)).toBe(2);
    expect(nivelSegunFps(NIVEL_MAXIMO, 1)).toBe(NIVEL_MAXIMO);
    expect(nivelSegunFps(2, 120)).toBe(2);
    // y llega hasta el último nivel, nunca más allá
    let nivel = 0;
    for (let i = 0; i < 20; i++) nivel = nivelSegunFps(nivel, 5);
    expect(nivel).toBe(NIVEL_MAXIMO);
  });

  it("cada nivel es igual o más liviano que el anterior, y el último es bastante más liviano que el primero", () => {
    expect(PROPORCION_POR_NIVEL).toHaveLength(NIVEL_MAXIMO + 1);
    expect(EFECTOS_POR_NIVEL).toHaveLength(NIVEL_MAXIMO + 1);
    expect(EFECTOS_POR_NIVEL[0]).toBe(true);
    expect(EFECTOS_POR_NIVEL[NIVEL_MAXIMO]).toBe(false);
    for (let i = 1; i <= NIVEL_MAXIMO; i++) {
      expect(PROPORCION_POR_NIVEL[i]).toBeLessThanOrEqual(PROPORCION_POR_NIVEL[i - 1]);
      expect(Number(EFECTOS_POR_NIVEL[i])).toBeLessThanOrEqual(Number(EFECTOS_POR_NIVEL[i - 1]));
    }
    expect(PROPORCION_POR_NIVEL[NIVEL_MAXIMO]).toBeLessThan(PROPORCION_POR_NIVEL[0]);
  });

  it("primero ahorra sin tocar la imagen: la nitidez es lo último que baja", () => {
    // en los dos primeros niveles que ahorran, la resolución se mantiene entera
    expect(PROPORCION_POR_NIVEL[1]).toBe(PROPORCION_POR_NIVEL[0]);
    expect(PROPORCION_POR_NIVEL[2]).toBe(PROPORCION_POR_NIVEL[0]);
    // los efectos se apagan antes de que baje la resolución
    const primeroSinEfectos = EFECTOS_POR_NIVEL.indexOf(false);
    const primeraBajaDeResolucion = PROPORCION_POR_NIVEL.findIndex((p) => p < PROPORCION_POR_NIVEL[0]);
    expect(primeroSinEfectos).toBeLessThan(primeraBajaDeResolucion);
  });

  it("nunca baja la resolución de 1, porque por debajo los carteles chicos no se leen", () => {
    for (const p of PROPORCION_POR_NIVEL) expect(p).toBeGreaterThanOrEqual(1);
  });

  it("cuanto más liviano el nivel, menos seguido se redibujan las sombras", () => {
    expect(SOMBRA_CADA_NIVEL).toHaveLength(NIVEL_MAXIMO + 1);
    for (let i = 1; i <= NIVEL_MAXIMO; i++) expect(SOMBRA_CADA_NIVEL[i]).toBeGreaterThanOrEqual(SOMBRA_CADA_NIVEL[i - 1]);
    expect(SOMBRA_CADA_NIVEL[NIVEL_MAXIMO]).toBeGreaterThan(SOMBRA_CADA_NIVEL[0]);
  });

  it("no mide los primeros segundos, mientras la tarjeta de video compila", () => {
    const m = crearMedidorDeFps(1000, 2000);
    // cuadros muy lentos (5 por segundo) durante el calentamiento: no cuentan
    for (let t = 0; t < 2000; t += 200) expect(m.cuadro(t)).toBeNull();
  });

  it("después del calentamiento devuelve los cuadros por segundo de cada ventana", () => {
    const m = crearMedidorDeFps(1000, 2000);
    let medida: number | null = null;
    // 20 cuadros por segundo (uno cada 50 ms): ya pasó el calentamiento
    for (let t = 0; t <= 3500 && medida === null; t += 50) {
      const r = m.cuadro(t);
      if (t > 2000 && r !== null) medida = r;
    }
    expect(medida).not.toBeNull();
    expect(medida as unknown as number).toBeGreaterThan(17);
    expect(medida as unknown as number).toBeLessThan(21);
  });

  it("reiniciar vuelve a empezar de cero (el rato parado no cuenta como lento)", () => {
    const m = crearMedidorDeFps(500, 1000);
    for (let t = 0; t < 3000; t += 16) m.cuadro(t);
    m.reiniciar();
    // un cuadro mucho tiempo después: es el primero de una nueva medición, no una ventana lenta
    expect(m.cuadro(60_000)).toBeNull();
    expect(m.cuadro(60_016)).toBeNull();
  });
});
