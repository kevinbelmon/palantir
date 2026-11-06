import { describe, expect, it } from "vitest";
import { AGENTES, ESTADO_INICIAL, reducir, ubicacionBrief } from "../src/flujo";

describe("el juego recién abierto", () => {
  it("no tiene a nadie habilitado: primero hay que dejar el brief", () => {
    expect(ESTADO_INICIAL.agentes).toHaveLength(AGENTES.length);
    expect(ESTADO_INICIAL.agentes.every((a) => a === "deshabilitado")).toBe(true);
    expect(ESTADO_INICIAL.briefDejado).toBe(false);
  });

  it("el brief todavía está en la mano de la persona", () => {
    expect(ubicacionBrief(ESTADO_INICIAL)).toBe("mano");
  });
});

describe("dejar el brief en la papelería", () => {
  const e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });

  it("el brief queda en la papelería", () => {
    expect(e.briefDejado).toBe(true);
    expect(ubicacionBrief(e)).toBe("papeleria");
  });

  it("habilita solo al agente 1", () => {
    expect(e.agentes[0]).toBe("habilitado");
    expect(e.agentes.slice(1).every((a) => a === "deshabilitado")).toBe(true);
  });

  it("dejarlo de nuevo no cambia nada", () => {
    expect(reducir(e, { tipo: "dejarBrief" })).toEqual(e);
  });

  it("no modifica el estado anterior", () => {
    expect(ESTADO_INICIAL.briefDejado).toBe(false);
    expect(ESTADO_INICIAL.agentes[0]).toBe("deshabilitado");
  });
});
