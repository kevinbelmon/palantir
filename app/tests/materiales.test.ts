import { describe, expect, it } from "vitest";
import { aleatorio } from "../src/escena/materiales";

describe("el azar de las texturas", () => {
  it("da siempre la misma secuencia con la misma semilla, y otra con otra", () => {
    const a = aleatorio(7);
    const b = aleatorio(7);
    const c = aleatorio(8);
    const xs = [a(), a(), a(), a()];
    expect([b(), b(), b(), b()]).toEqual(xs);
    expect([c(), c(), c(), c()]).not.toEqual(xs);
  });

  it("los números están entre 0 y 1 y no se repiten sin parar", () => {
    const a = aleatorio(99);
    const xs = Array.from({ length: 500 }, () => a());
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(new Set(xs).size).toBeGreaterThan(490);
    const media = xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(media).toBeGreaterThan(0.4);
    expect(media).toBeLessThan(0.6);
  });
});
