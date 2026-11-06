import { describe, expect, it } from "vitest";
import { ladrillosEn, tacosEn, tirasDeMuro } from "../src/oficina";

const area = { x: 10, y: 20, w: 100, h: 60 };

describe("los tacos del piso", () => {
  it("hay uno por cada casillero de la grilla, en el centro de cada uno", () => {
    const t = tacosEn(area, 20);
    expect(t).toHaveLength(5 * 3);
    expect(t[0]).toEqual({ x: 20, y: 30 });
    expect(t[t.length - 1]).toEqual({ x: 100, y: 70 });
  });

  it("todos quedan adentro del área", () => {
    for (const p of tacosEn(area, 20)) {
      expect(p.x).toBeGreaterThan(area.x);
      expect(p.x).toBeLessThan(area.x + area.w);
      expect(p.y).toBeGreaterThan(area.y);
      expect(p.y).toBeLessThan(area.y + area.h);
    }
  });

  it("con un paso inválido no devuelve nada, en vez de colgarse", () => {
    expect(tacosEn(area, 0)).toEqual([]);
    expect(tacosEn(area, -5)).toEqual([]);
  });
});

describe("los ladrillos de una pared", () => {
  const pared = { x: 0, y: 0, w: 100, h: 40 };
  const filas = (alto: number) => {
    const l = ladrillosEn(pared, alto, 40);
    return [...new Set(l.map((b) => b.y))].sort((a, b) => a - b).map((y) => l.filter((b) => b.y === y));
  };

  it("arma tantas hiladas como entren en el alto", () => {
    expect(filas(20)).toHaveLength(2);
  });

  it("cada hilada cubre el ancho justo, sin huecos ni solapes", () => {
    for (const fila of filas(20)) {
      const ordenada = [...fila].sort((a, b) => a.x - b.x);
      expect(ordenada[0].x).toBe(pared.x);
      ordenada.forEach((b, i) => {
        if (i > 0) expect(b.x).toBeCloseTo(ordenada[i - 1].x + ordenada[i - 1].w);
      });
      const ultimo = ordenada[ordenada.length - 1];
      expect(ultimo.x + ultimo.w).toBeCloseTo(pared.x + pared.w);
    }
  });

  it("las hiladas se alternan, como en una pared de verdad (la de arriba arranca con medio ladrillo)", () => {
    const [primera, segunda] = filas(20);
    const pri = [...primera].sort((a, b) => a.x - b.x)[0];
    const seg = [...segunda].sort((a, b) => a.x - b.x)[0];
    expect(pri.w).toBe(40);
    expect(seg.w).toBe(20);
  });

  it("ningún ladrillo se sale de la pared", () => {
    for (const b of ladrillosEn(pared, 20, 40)) {
      expect(b.x).toBeGreaterThanOrEqual(pared.x);
      expect(b.x + b.w).toBeLessThanOrEqual(pared.x + pared.w + 0.001);
      expect(b.y + b.h).toBeLessThanOrEqual(pared.y + pared.h + 0.001);
    }
  });
});

describe("las tiras de pared de una sala", () => {
  const sala = { x: 100, y: 100, w: 560, h: 420 };

  it("son cinco, con la puerta del lado que se pide", () => {
    for (const puerta of ["abajo", "arriba", "izquierda"] as const) {
      expect(tirasDeMuro(sala, puerta)).toHaveLength(5);
    }
  });

  it("dejan un hueco de 130 de ancho en el lado de la puerta", () => {
    const sur = tirasDeMuro(sala, "abajo").filter((t) => t.lado === "sur");
    expect(sur).toHaveLength(2);
    const [izq, der] = [...sur].sort((a, b) => a.rect.x - b.rect.x);
    expect(der.rect.x - (izq.rect.x + izq.rect.w)).toBeCloseTo(130);
  });

  it("nadie tapa el centro de la puerta, y el resto de los lados está cerrado", () => {
    const tapa = (x: number, y: number, puerta: "abajo" | "arriba" | "izquierda") =>
      tirasDeMuro(sala, puerta).some(({ rect: r }) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    expect(tapa(sala.x + sala.w / 2, sala.y + sala.h, "abajo")).toBe(false);
    expect(tapa(sala.x + sala.w / 2, sala.y, "abajo")).toBe(true);
    expect(tapa(sala.x, sala.y + sala.h / 2, "izquierda")).toBe(false);
    expect(tapa(sala.x + sala.w, sala.y + sala.h / 2, "izquierda")).toBe(true);
  });

  it("marcan a qué lado pertenece cada tira (norte, sur, oeste y este)", () => {
    const lados = new Set(tirasDeMuro(sala, "abajo").map((t) => t.lado));
    expect([...lados].sort()).toEqual(["este", "norte", "oeste", "sur"]);
  });
});
