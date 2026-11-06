import { describe, expect, it } from "vitest";
import { BRIEF_EJEMPLO, mensajeGuia } from "../src/contenido";
import { ESTADO_INICIAL, reducir } from "../src/flujo";

describe("el brief de ejemplo", () => {
  it("es una app para dividir gastos entre amigos, explicada en palabras simples", () => {
    expect(BRIEF_EJEMPLO.titulo.toLowerCase()).toContain("dividir gastos");
    expect(BRIEF_EJEMPLO.lineas.length).toBeGreaterThanOrEqual(3);
    for (const l of BRIEF_EJEMPLO.lineas) expect(l.length).toBeGreaterThan(10);
  });
});

describe("la guía que acompaña a la persona", () => {
  it("al empezar le dice que deje el brief en la papelería", () => {
    expect(mensajeGuia(ESTADO_INICIAL).toLowerCase()).toContain("papelería");
  });

  it("después de dejarlo le dice que ordene correr al primer agente", () => {
    const texto = mensajeGuia(reducir(ESTADO_INICIAL, { tipo: "dejarBrief" })).toLowerCase();
    expect(texto).toContain("refine");
    expect(texto).toContain("correr");
  });
});

describe("la guía mientras un agente trabaja", () => {
  it("avisa que está trabajando y que hay que esperar", () => {
    const corriendo = reducir(reducir(ESTADO_INICIAL, { tipo: "dejarBrief" }), { tipo: "ordenarCorrer", indice: 0 });
    const texto = mensajeGuia(corriendo).toLowerCase();
    expect(texto).toContain("trabajando");
    expect(texto).toContain("refine");
  });
});

describe("la guía cuando un agente terminó", () => {
  it("le dice que lea el documento sobre su escritorio", () => {
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    e = reducir(e, { tipo: "ordenarCorrer", indice: 0 });
    e = reducir(e, { tipo: "terminarCorrida", indice: 0 });
    const texto = mensajeGuia(e).toLowerCase();
    expect(texto).toContain("terminó");
    expect(texto).toContain("documento");
  });

  it("mientras lee un documento, la guía se calla", () => {
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    e = reducir(e, { tipo: "ordenarCorrer", indice: 0 });
    e = reducir(e, { tipo: "terminarCorrida", indice: 0 });
    e = reducir(e, { tipo: "abrirDocumento", indice: 0 });
    expect(mensajeGuia(e)).toBe("");
  });
});
