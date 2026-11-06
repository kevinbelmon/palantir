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
