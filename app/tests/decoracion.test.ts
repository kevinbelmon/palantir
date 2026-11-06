import { describe, expect, it } from "vitest";
import { LOBBY, SALAS, type Rect } from "../src/oficina";
import { BEBEDERO, COLEGAS_REVIEW, MESA_REDONDA_REVIEW, PLANTAS, SILLON } from "../src/oficina/decoracion";
import { APARIENCIAS, PALETA } from "../src/oficina/paleta";

const contiene = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const colorValido = /^(#[0-9a-f]{6}|rgba?\([\d\s.,]+\))$/i;

describe("la paleta", () => {
  it("define solo colores válidos", () => {
    for (const [nombre, valor] of Object.entries(PALETA)) expect(valor, nombre).toMatch(colorValido);
  });

  it("le da a cada agente una camisa y un pelo propios", () => {
    expect(APARIENCIAS).toHaveLength(8);
    expect(new Set(APARIENCIAS.map((a) => a.camisa)).size).toBe(8);
    for (const a of APARIENCIAS) {
      expect(a.camisa).toMatch(colorValido);
      expect(a.pelo).toMatch(colorValido);
    }
  });
});

describe("las plantas", () => {
  it("cada sala tiene al menos una, adentro de la sala", () => {
    for (const s of SALAS) {
      const propias = PLANTAS.filter((p) => contiene(s.area, p.x, p.y));
      expect(propias.length, `sala ${s.numero}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("el lobby tiene al menos tres", () => {
    expect(PLANTAS.filter((p) => contiene(LOBBY, p.x, p.y)).length).toBeGreaterThanOrEqual(3);
  });

  it("ninguna tapa un escritorio", () => {
    for (const s of SALAS) {
      for (const p of PLANTAS.filter((q) => contiene(s.area, q.x, q.y))) {
        expect(contiene({ x: s.escritorio.x - 30, y: s.escritorio.y - 60, w: s.escritorio.w + 60, h: s.escritorio.h + 90 }, p.x, p.y)).toBe(false);
      }
    }
  });
});

describe("el lobby", () => {
  it("tiene un sillón y un bebedero, adentro del lobby", () => {
    expect(contiene(LOBBY, SILLON.x, SILLON.y)).toBe(true);
    expect(contiene(LOBBY, SILLON.x + SILLON.w, SILLON.y + SILLON.h)).toBe(true);
    expect(contiene(LOBBY, BEBEDERO.x, BEBEDERO.y)).toBe(true);
  });
});

describe("la sala de vidrio del review", () => {
  const sala = SALAS[7];

  it("es la única de vidrio", () => {
    expect(sala.tipo).toBe("vidrio");
    expect(SALAS.slice(0, 7).every((s) => s.tipo === "normal")).toBe(true);
  });

  it("tiene una mesa redonda de reuniones y colegas sentados alrededor", () => {
    expect(contiene(sala.area, MESA_REDONDA_REVIEW.x, MESA_REDONDA_REVIEW.y)).toBe(true);
    expect(COLEGAS_REVIEW.length).toBeGreaterThanOrEqual(3);
    for (const c of COLEGAS_REVIEW) expect(contiene(sala.area, c.x, c.y)).toBe(true);
  });
});
