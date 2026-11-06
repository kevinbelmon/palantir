import { describe, expect, it } from "vitest";
import { parpadeo, respiracion, tiempoVisible } from "../src/oficina";

const muestras = (f: (t: number) => number | boolean) => Array.from({ length: 1200 }, (_, i) => f(i * 0.05));

describe("el parpadeo", () => {
  it("es un instante corto de vez en cuando, no todo el tiempo", () => {
    const cerrados = muestras((t) => parpadeo(t, 0)).filter(Boolean).length;
    expect(cerrados).toBeGreaterThan(1200 * 0.01);
    expect(cerrados).toBeLessThan(1200 * 0.08);
  });

  it("cada agente parpadea en un momento distinto", () => {
    const distintos = muestras((t) => parpadeo(t, 0) !== parpadeo(t, 3)).filter(Boolean).length;
    expect(distintos).toBeGreaterThan(0);
  });
});

describe("la respiración", () => {
  it("sube y baja unos pocos píxeles, sin saltos", () => {
    const valores = muestras((t) => respiracion(t, 2)) as number[];
    expect(Math.max(...valores)).toBeLessThanOrEqual(3);
    expect(Math.min(...valores)).toBeGreaterThanOrEqual(-3);
    expect(Math.max(...valores) - Math.min(...valores)).toBeGreaterThan(1);
  });

  it("cada agente respira a su ritmo", () => {
    expect(respiracion(1.3, 0)).not.toBeCloseTo(respiracion(1.3, 5), 3);
  });
});

describe("el tiempo que ve la animación", () => {
  it("es el tiempo real si todo se mueve", () => {
    expect(tiempoVisible(12.5, false)).toBe(12.5);
  });

  it("queda en cero si el sistema pide menos movimiento: nada se anima", () => {
    expect(tiempoVisible(12.5, true)).toBe(0);
  });
});
