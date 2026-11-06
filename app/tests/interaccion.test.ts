import { describe, expect, it } from "vitest";
import { elementoEn, LOBBY, PAPELERIA, SALAS } from "../src/oficina";

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
