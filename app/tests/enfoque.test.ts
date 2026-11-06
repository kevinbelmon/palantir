import { describe, expect, it } from "vitest";
import { camaraAjustada, camaraEnSala, interpolarCamara, limitesZoom, mundoAPantalla, SALAS } from "../src/oficina";

const VISTA = { ancho: 1700, alto: 1000 };
const BARRA = 64;

describe("la cámara que va a una sala", () => {
  it("deja el centro de la sala en el centro de la zona visible (debajo de la barra)", () => {
    for (const s of SALAS) {
      const c = camaraEnSala(s, VISTA, BARRA);
      const p = mundoAPantalla(c, s.area.x + s.area.w / 2, s.area.y + s.area.h / 2);
      expect(p.x).toBeCloseTo(VISTA.ancho / 2, 0);
      expect(p.y).toBeCloseTo(BARRA + (VISTA.alto - BARRA) / 2, 0);
    }
  });

  it("muestra la sala entera, con un poco de aire alrededor", () => {
    for (const s of SALAS) {
      const c = camaraEnSala(s, VISTA, BARRA);
      const a = mundoAPantalla(c, s.area.x, s.area.y);
      const b = mundoAPantalla(c, s.area.x + s.area.w, s.area.y + s.area.h);
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeGreaterThanOrEqual(BARRA);
      expect(b.x).toBeLessThanOrEqual(VISTA.ancho);
      expect(b.y).toBeLessThanOrEqual(VISTA.alto);
    }
  });

  it("se acerca más que la vista de toda la oficina, sin pasarse del zoom máximo", () => {
    const { max } = limitesZoom(VISTA.ancho, VISTA.alto);
    const todo = camaraAjustada(VISTA.ancho, VISTA.alto, BARRA).zoom;
    for (const s of SALAS) {
      const z = camaraEnSala(s, VISTA, BARRA).zoom;
      expect(z).toBeGreaterThan(todo);
      expect(z).toBeLessThanOrEqual(max + 1e-9);
    }
  });
});

describe("el viaje de la cámara", () => {
  const a = { x: 0, y: 0, zoom: 0.5 };
  const b = { x: 1000, y: 400, zoom: 1.5 };

  it("empieza en el origen y termina en el destino", () => {
    expect(interpolarCamara(a, b, 0)).toEqual(a);
    expect(interpolarCamara(a, b, 1)).toEqual(b);
  });

  it("a mitad de camino está entre los dos", () => {
    const m = interpolarCamara(a, b, 0.5);
    expect(m.x).toBeGreaterThan(a.x);
    expect(m.x).toBeLessThan(b.x);
    expect(m.zoom).toBeGreaterThan(a.zoom);
    expect(m.zoom).toBeLessThan(b.zoom);
  });

  it("avanza siempre hacia adelante, sin ir y volver", () => {
    let antes = -Infinity;
    for (let k = 0; k <= 1; k += 0.05) {
      const x = interpolarCamara(a, b, k).x;
      expect(x).toBeGreaterThanOrEqual(antes);
      antes = x;
    }
  });

  it("si se pasa del rango, se queda en los extremos", () => {
    expect(interpolarCamara(a, b, -2)).toEqual(a);
    expect(interpolarCamara(a, b, 7)).toEqual(b);
  });
});
