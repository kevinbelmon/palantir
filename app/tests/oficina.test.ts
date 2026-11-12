import { describe, expect, it } from "vitest";
import { AGENTES } from "../src/flujo";
import { camaraAjustada, CARTEL_CENTRAL, LOBBY, MUNDO, PAPELERIA, SALAS, type Rect } from "../src/oficina";

const dentro = (a: Rect, b: Rect) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
const seSolapan = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe("los agentes del flujo", () => {
  it("son 8, en el orden del ciclo del modelo", () => {
    expect(AGENTES.map((a) => a.id)).toEqual(["refine", "generate", "validate", "log", "implement", "e2e", "checklist", "review"]);
    expect(AGENTES.map((a) => a.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("las salas de la oficina", () => {
  it("hay una por agente, en el mismo orden y con su comando", () => {
    expect(SALAS).toHaveLength(8);
    SALAS.forEach((s, i) => {
      expect(s.numero).toBe(i + 1);
      expect(s.comando).toBe(AGENTES[i].comando);
    });
  });

  it("las salas 1 a 4 van arriba, de izquierda a derecha", () => {
    const arriba = SALAS.slice(0, 4);
    arriba.forEach((s) => expect(s.area.y + s.area.h).toBeLessThanOrEqual(LOBBY.y));
    for (let i = 1; i < 4; i++) expect(arriba[i].area.x).toBeGreaterThan(arriba[i - 1].area.x);
  });

  it("las salas 5 a 7 van abajo, de izquierda a derecha", () => {
    const abajo = SALAS.slice(4, 7);
    abajo.forEach((s) => expect(s.area.y).toBeGreaterThanOrEqual(LOBBY.y + LOBBY.h));
    for (let i = 1; i < 3; i++) expect(abajo[i].area.x).toBeGreaterThan(abajo[i - 1].area.x);
  });

  it("la sala 8 (review) queda a la derecha de todas las demás", () => {
    const ultima = SALAS[7];
    SALAS.slice(0, 7).forEach((s) => expect(ultima.area.x).toBeGreaterThanOrEqual(s.area.x));
    expect(ultima.area.x).toBeGreaterThanOrEqual(LOBBY.x + LOBBY.w);
  });

  it("cada sala trae su pizarra, su escritorio y su personaje adentro", () => {
    for (const s of SALAS) {
      expect(dentro(s.pizarra, s.area)).toBe(true);
      expect(dentro(s.escritorio, s.area)).toBe(true);
      expect(s.personaje.x).toBeGreaterThan(s.area.x);
      expect(s.personaje.x).toBeLessThan(s.area.x + s.area.w);
      expect(s.personaje.y).toBeGreaterThan(s.area.y);
      expect(s.personaje.y).toBeLessThan(s.area.y + s.area.h);
    }
  });
});

describe("el mapa de la oficina", () => {
  const zonas: [string, Rect][] = [...SALAS.map((s): [string, Rect] => [`sala ${s.numero}`, s.area]), ["lobby", LOBBY], ["papelería", PAPELERIA]];

  it("todo entra en el mundo", () => {
    const mundo = { x: 0, y: 0, w: MUNDO.ancho, h: MUNDO.alto };
    for (const [, r] of zonas) expect(dentro(r, mundo)).toBe(true);
  });

  it("ninguna zona se pisa con otra", () => {
    for (let i = 0; i < zonas.length; i++) {
      for (let j = i + 1; j < zonas.length; j++) {
        expect(seSolapan(zonas[i][1], zonas[j][1]), `${zonas[i][0]} con ${zonas[j][0]}`).toBe(false);
      }
    }
  });

  it("la papelería es una zona propia, pegada al lobby", () => {
    expect(PAPELERIA.x + PAPELERIA.w).toBeLessThanOrEqual(LOBBY.x);
    expect(LOBBY.x - (PAPELERIA.x + PAPELERIA.w)).toBeLessThanOrEqual(60);
  });

  it("el lobby tiene el cartel con el nombre del modelo y su lema", () => {
    expect(CARTEL_CENTRAL.titulo).toBe("Spec-Driven Development");
    expect(CARTEL_CENTRAL.lema).toBe("Ocho pasos, de la idea al trabajo revisado.");
    expect(dentro(CARTEL_CENTRAL.area, LOBBY)).toBe(true);
  });

  it("es mucho más grande que una pantalla común", () => {
    expect(MUNDO.ancho).toBeGreaterThan(1920);
    expect(MUNDO.alto).toBeGreaterThan(1080);
    // la casa creció a más del doble del plano anterior (2600 × 1800)
    expect(MUNDO.ancho * MUNDO.alto).toBeGreaterThan(9_000_000);
    expect(MUNDO.alto).toBeGreaterThan(2400);
  });
});

describe("la cámara ajustada", () => {
  it("deja ver todo el mundo en una ventana de cualquier forma", () => {
    for (const [w, h] of [[1280, 720], [1920, 1080], [900, 900]]) {
      const c = camaraAjustada(w, h);
      expect(c.zoom).toBeGreaterThan(0);
      const derecha = (MUNDO.ancho - c.x) * c.zoom;
      const abajo = (MUNDO.alto - c.y) * c.zoom;
      expect(derecha).toBeLessThanOrEqual(w + 0.5);
      expect(abajo).toBeLessThanOrEqual(h + 0.5);
      expect(-c.x * c.zoom).toBeGreaterThanOrEqual(-0.5);
    }
  });
});
