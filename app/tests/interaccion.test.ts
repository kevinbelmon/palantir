import { describe, expect, it } from "vitest";
import { elementoEn, LOBBY, PAPELERIA, rectBrief, rectDocumento, SALAS } from "../src/oficina";

describe("qué hay bajo el mouse", () => {
  it("la zona del brief en la papelería es la papelería", () => {
    expect(elementoEn(PAPELERIA.x + 200, PAPELERIA.y + 260)).toEqual({ tipo: "papeleria" });
  });

  it("el escritorio de cada sala es su agente", () => {
    SALAS.forEach((s, i) => {
      const e = s.escritorio;
      expect(elementoEn(e.x + e.w / 2, e.y + e.h / 2)).toEqual({ tipo: "agente", indice: i });
    });
  });

  it("el personaje de cada sala también es su agente", () => {
    SALAS.forEach((s, i) => {
      expect(elementoEn(s.personaje.x, s.personaje.y - 50)).toEqual({ tipo: "agente", indice: i });
    });
  });

  it("el pasillo, el lobby vacío y afuera no son nada", () => {
    expect(elementoEn(LOBBY.x + 20, LOBBY.y + 20)).toBeNull();
    expect(elementoEn(5, 5)).toBeNull();
    expect(elementoEn(LOBBY.x + 600, LOBBY.y - 20)).toBeNull();
  });
});

describe("el documento sobre el escritorio", () => {
  it("cada sala tiene su documento, adentro de la sala", () => {
    SALAS.forEach((s) => {
      const r = rectDocumento(s);
      expect(r.x).toBeGreaterThanOrEqual(s.area.x);
      expect(r.x + r.w).toBeLessThanOrEqual(s.area.x + s.area.w);
      expect(r.y + r.h).toBeLessThanOrEqual(s.area.y + s.area.h);
    });
  });

  it("tocarlo es tocar el documento de ese agente", () => {
    SALAS.forEach((s, i) => {
      const r = rectDocumento(s);
      expect(elementoEn(r.x + r.w / 2, r.y + r.h / 2)).toEqual({ tipo: "documento", indice: i });
    });
  });

  it("el brief y el documento no se tapan entre sí", () => {
    SALAS.forEach((s) => {
      const a = rectBrief(s);
      const b = rectDocumento(s);
      const seTapan = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      expect(seTapan).toBe(false);
    });
  });
});
