import { describe, expect, it } from "vitest";
import { LOBBY, puertaDeSala, SALAS } from "../src/oficina";
import { alfombraDeSala, colorDePiso, COLORES_SALA, marcoDePuerta, mezclarHex, placaDePuerta, relojDeSala, ventanaDeSala } from "../src/escena/identidad";

const solapa = (a: { x: number; w: number }, b: { x: number; w: number }) => a.x < b.x + b.w && b.x < a.x + a.w;

describe("mezclar colores", () => {
  it("0 deja el primero, 1 el segundo y 0.5 el punto medio", () => {
    expect(mezclarHex("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mezclarHex("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(mezclarHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mezclarHex("#ff0000", "#0000ff", 0.5)).toBe("#800080");
  });
});

describe("la identidad de cada oficina", () => {
  it("cada agente tiene su color y su piso, todos distintos", () => {
    expect(COLORES_SALA).toHaveLength(SALAS.length);
    expect(new Set(COLORES_SALA).size).toBe(SALAS.length);
    expect(new Set(SALAS.map((_, i) => colorDePiso(i))).size).toBe(SALAS.length);
    for (let i = 0; i < SALAS.length; i++) expect(colorDePiso(i)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("el marco de la puerta deja libre el hueco de 130 y está centrado en la puerta", () => {
    for (const s of SALAS) {
      const { postes, dintel } = marcoDePuerta(s);
      const puerta = puertaDeSala(s);
      if (s.tipo === "vidrio") {
        const [arriba, abajo] = [...postes].sort((p, q) => p.y - q.y);
        expect(abajo.y - (arriba.y + arriba.h)).toBeCloseTo(130);
        expect((arriba.y + abajo.y + abajo.h) / 2).toBeCloseTo(puerta.y);
        expect(dintel.h).toBeCloseTo(130 + 32);
      } else {
        const [izq, der] = [...postes].sort((p, q) => p.x - q.x);
        expect(der.x - (izq.x + izq.w)).toBeCloseTo(130);
        expect((izq.x + der.x + der.w) / 2).toBeCloseTo(puerta.x);
        expect(dintel.w).toBeCloseTo(130 + 32);
        // sobre la pared de su lado: sur para las de arriba, norte para las de abajo
        expect(izq.y + izq.h / 2).toBeCloseTo(s.area.y < LOBBY.y ? s.area.y + s.area.h : s.area.y);
      }
    }
  });

  it("la placa de cada puerta queda del lado de afuera, junto al marco y sobre la pared", () => {
    for (const s of SALAS) {
      const p = placaDePuerta(s);
      const a = s.area;
      expect(p.altura).toBeGreaterThan(100);
      expect(p.altura).toBeLessThan(170);
      if (s.tipo === "vidrio") {
        expect(p.x).toBeLessThan(a.x);
        expect(p.z).toBeGreaterThan(a.y);
        expect(p.z).toBeLessThan(puertaDeSala(s).y - 65);
        expect(p.giroY).toBeCloseTo(-Math.PI / 2);
      } else if (a.y < LOBBY.y) {
        expect(p.z).toBeGreaterThan(a.y + a.h);
        expect(p.giroY).toBe(0);
        expect(p.x).toBeGreaterThan(puertaDeSala(s).x + 65);
        expect(p.x).toBeLessThan(a.x + a.w);
      } else {
        expect(p.z).toBeLessThan(a.y);
        expect(p.giroY).toBeCloseTo(Math.PI);
        expect(p.x).toBeLessThan(puertaDeSala(s).x - 65);
        expect(p.x).toBeGreaterThan(a.x);
      }
    }
  });

  it("la alfombra queda adentro de la sala y cubre el escritorio o la mesa", () => {
    for (const s of SALAS) {
      const r = alfombraDeSala(s);
      expect(r.x).toBeGreaterThan(s.area.x);
      expect(r.y).toBeGreaterThan(s.area.y);
      expect(r.x + r.w).toBeLessThan(s.area.x + s.area.w);
      expect(r.y + r.h).toBeLessThan(s.area.y + s.area.h);
      if (s.tipo !== "vidrio") {
        const e = s.escritorio;
        expect(r.x).toBeLessThan(e.x);
        expect(r.x + r.w).toBeGreaterThan(e.x + e.w);
        expect(r.y).toBeLessThan(s.personaje.y);
        expect(r.y + r.h).toBeGreaterThan(e.y + e.h);
      }
    }
  });

  it("la ventana y el reloj están sobre la pared del fondo sin tapar la pizarra ni entre sí", () => {
    for (const s of SALAS) {
      const v = ventanaDeSala(s);
      const r = relojDeSala(s);
      const reloj = { x: r.x - r.radio, w: r.radio * 2 };
      expect(v.x).toBeGreaterThan(s.area.x);
      expect(v.x + v.w).toBeLessThan(s.area.x + s.area.w);
      expect(v.base + v.alto).toBeLessThan(170);
      expect(solapa(v, s.pizarra)).toBe(false);
      expect(solapa(reloj, s.pizarra)).toBe(false);
      expect(solapa(reloj, v)).toBe(false);
      expect(r.altura + r.radio).toBeLessThan(170);
    }
  });
});
