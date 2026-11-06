import { describe, expect, it } from "vitest";
import { AGENTES, DURACION_CORRIDA_MS, ESTADO_INICIAL, reducir, ubicacionBrief } from "../src/flujo";

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

describe("ordenar correr a un agente", () => {
  const listo = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });

  it("el agente habilitado pasa a estar corriendo", () => {
    const e = reducir(listo, { tipo: "ordenarCorrer", indice: 0 });
    expect(e.agentes[0]).toBe("corriendo");
    expect(e.agentes.slice(1).every((a) => a === "deshabilitado")).toBe(true);
  });

  it("un agente deshabilitado no corre, aunque se lo ordenen", () => {
    expect(reducir(listo, { tipo: "ordenarCorrer", indice: 3 })).toEqual(listo);
    expect(reducir(ESTADO_INICIAL, { tipo: "ordenarCorrer", indice: 0 })).toEqual(ESTADO_INICIAL);
  });

  it("ordenarle a uno que ya corre no hace nada", () => {
    const corriendo = reducir(listo, { tipo: "ordenarCorrer", indice: 0 });
    expect(reducir(corriendo, { tipo: "ordenarCorrer", indice: 0 })).toEqual(corriendo);
  });

  it("un número de agente que no existe no rompe nada", () => {
    expect(reducir(listo, { tipo: "ordenarCorrer", indice: 99 })).toEqual(listo);
    expect(reducir(listo, { tipo: "ordenarCorrer", indice: -1 })).toEqual(listo);
  });

  it("al terminar, el agente pasa a terminado", () => {
    const corriendo = reducir(listo, { tipo: "ordenarCorrer", indice: 0 });
    expect(reducir(corriendo, { tipo: "terminarCorrida", indice: 0 }).agentes[0]).toBe("terminado");
  });

  it("solo termina el que estaba corriendo", () => {
    expect(reducir(listo, { tipo: "terminarCorrida", indice: 0 })).toEqual(listo);
  });

  it("la corrida dura unos segundos, lo justo para leer el globito", () => {
    expect(DURACION_CORRIDA_MS).toBeGreaterThanOrEqual(2000);
    expect(DURACION_CORRIDA_MS).toBeLessThanOrEqual(8000);
  });
});
