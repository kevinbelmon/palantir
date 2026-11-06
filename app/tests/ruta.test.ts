import { describe, expect, it } from "vitest";
import { estadoDeSegmento, longitudDeSegmento, MUNDO, PAPELERIA, puertaDeSala, puntoEnRuta, RUTA, SALAS } from "../src/oficina";
import type { EstadoAgente } from "../src/flujo";

const cerca = (a: { x: number; y: number }, b: { x: number; y: number }, d = 30) => Math.hypot(a.x - b.x, a.y - b.y) <= d;

describe("las puertas de las salas", () => {
  it("las de arriba dan al pasillo de abajo, las de abajo al de arriba y la de vidrio a la izquierda", () => {
    expect(puertaDeSala(SALAS[0])).toEqual({ x: SALAS[0].area.x + SALAS[0].area.w / 2, y: SALAS[0].area.y + SALAS[0].area.h });
    expect(puertaDeSala(SALAS[4])).toEqual({ x: SALAS[4].area.x + SALAS[4].area.w / 2, y: SALAS[4].area.y });
    expect(puertaDeSala(SALAS[7])).toEqual({ x: SALAS[7].area.x, y: SALAS[7].area.y + SALAS[7].area.h / 2 });
  });
});

describe("la ruta del brief", () => {
  it("tiene un tramo por agente: de la papelería al 1, del 1 al 2… hasta el 8", () => {
    expect(RUTA).toHaveLength(8);
    for (const tramo of RUTA) expect(tramo.length).toBeGreaterThanOrEqual(2);
  });

  it("el primer tramo sale de la papelería", () => {
    const [x, y] = [RUTA[0][0].x, RUTA[0][0].y];
    expect(x).toBeGreaterThanOrEqual(PAPELERIA.x);
    expect(x).toBeLessThanOrEqual(PAPELERIA.x + PAPELERIA.w);
    expect(Math.abs(y - PAPELERIA.y)).toBeLessThanOrEqual(10);
  });

  it("cada tramo termina en la puerta de su agente y empieza donde terminó el anterior", () => {
    RUTA.forEach((tramo, i) => {
      expect(cerca(tramo[tramo.length - 1], puertaDeSala(SALAS[i])), `tramo ${i + 1}`).toBe(true);
      if (i > 0) expect(cerca(tramo[0], RUTA[i - 1][RUTA[i - 1].length - 1]), `empalme ${i}`).toBe(true);
    });
  });

  it("va solo en horizontal y vertical, como un pasillo, y dentro del mundo", () => {
    for (const tramo of RUTA) {
      tramo.forEach((p, i) => {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(MUNDO.ancho);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(MUNDO.alto);
        if (i > 0) expect(p.x === tramo[i - 1].x || p.y === tramo[i - 1].y).toBe(true);
      });
    }
  });
});

describe("el estado de cada tramo", () => {
  const e = (...a: EstadoAgente[]) => a;
  it("pendiente hasta que el agente se habilita, activo mientras espera o trabaja, hecho al terminar", () => {
    const agentes = e("terminado", "corriendo", "habilitado", "deshabilitado", "deshabilitado", "deshabilitado", "deshabilitado", "deshabilitado");
    expect(estadoDeSegmento(0, agentes)).toBe("hecho");
    expect(estadoDeSegmento(1, agentes)).toBe("activo");
    expect(estadoDeSegmento(2, agentes)).toBe("activo");
    expect(estadoDeSegmento(3, agentes)).toBe("pendiente");
  });

  it("un tramo que no existe queda pendiente", () => {
    expect(estadoDeSegmento(99, ["terminado"])).toBe("pendiente");
  });
});

describe("el punto que viaja por un tramo", () => {
  const tramo = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }];

  it("mide el largo del tramo", () => {
    expect(longitudDeSegmento(tramo)).toBe(150);
  });

  it("al principio está en el primer punto y al final en el último", () => {
    expect(puntoEnRuta(tramo, 0)).toEqual({ x: 0, y: 0 });
    expect(puntoEnRuta(tramo, 1)).toEqual({ x: 100, y: 50 });
  });

  it("a mitad de camino está a la mitad del largo, doblando en la esquina", () => {
    expect(puntoEnRuta(tramo, 0.5)).toEqual({ x: 75, y: 0 });
    expect(puntoEnRuta(tramo, 5 / 6)).toEqual({ x: 100, y: 25 });
  });

  it("si se pasa del rango, se queda en los extremos", () => {
    expect(puntoEnRuta(tramo, -3)).toEqual({ x: 0, y: 0 });
    expect(puntoEnRuta(tramo, 9)).toEqual({ x: 100, y: 50 });
  });
});
