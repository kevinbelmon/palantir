import { describe, expect, it } from "vitest";
import { LOBBY, PAPELERIA, SALAS, type Rect } from "../src/oficina";
import { BEBEDERO, COLEGAS_REVIEW, MESA_REDONDA_REVIEW, OBJETOS_SALA, PLANTAS } from "../src/oficina/decoracion";
import { SOFAS_LOBBY } from "../src/escena/distribucion";
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
  it("tiene el bebedero adentro del lobby", () => {
    // va pegado a la pared de la sala de vidrio, 40 más allá del borde del piso del lobby
    const conParedes = { x: LOBBY.x - 40, y: LOBBY.y, w: LOBBY.w + 80, h: LOBBY.h };
    expect(contiene(conParedes, BEBEDERO.x, BEBEDERO.y)).toBe(true);
    expect(contiene(conParedes, BEBEDERO.x + BEBEDERO.w, BEBEDERO.y + BEBEDERO.h)).toBe(true);
  });

  it("apoya cada sillón y el bebedero contra una pared de verdad (nada flotando en medio de la nada)", () => {
    // paredes laterales del lobby: la este de la papelería (cara hacia el lobby en x=528) y la oeste de la sala de vidrio (x=1892)
    const paredes = [PAPELERIA.x + PAPELERIA.w + 8, SALAS[7].area.x - 8];
    for (const s of SOFAS_LOBBY) {
      const respaldo = s.giro > 0 ? s.x - s.fondo / 2 : s.x + s.fondo / 2;
      expect(Math.min(...paredes.map((p) => Math.abs(p - respaldo)))).toBeLessThanOrEqual(8);
    }
    expect(Math.abs(SALAS[7].area.x - 8 - (BEBEDERO.x + BEBEDERO.w))).toBeLessThanOrEqual(12);
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

describe("los objetos propios de cada sala", () => {
  it("cada sala tiene el suyo, y no se repiten: se nota qué hace cada agente", () => {
    expect(OBJETOS_SALA).toHaveLength(8);
    expect(new Set(OBJETOS_SALA.map((o) => o.tipo)).size).toBe(8);
    OBJETOS_SALA.forEach((o, i) => expect(o.sala).toBe(i));
  });

  it("están adentro de su sala y no tapan el escritorio", () => {
    for (const o of OBJETOS_SALA) {
      const s = SALAS[o.sala];
      expect(contiene(s.area, o.x, o.y), `sala ${s.numero}`).toBe(true);
      expect(contiene(s.area, o.x + o.w, o.y + o.h), `sala ${s.numero}`).toBe(true);
      const tapa = { x: s.escritorio.x - 30, y: s.escritorio.y - 60, w: s.escritorio.w + 60, h: s.escritorio.h + 90 };
      const seTapan = o.x < tapa.x + tapa.w && tapa.x < o.x + o.w && o.y < tapa.y + tapa.h && tapa.y < o.y + o.h;
      expect(seTapan, `sala ${s.numero}`).toBe(false);
    }
  });
});
