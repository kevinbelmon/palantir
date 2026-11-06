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

describe("la guía cuando terminó el último agente", () => {
  const recorrido = () => {
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    for (let i = 0; i < 8; i++) {
      e = reducir(e, { tipo: "ordenarCorrer", indice: i });
      e = reducir(e, { tipo: "terminarCorrida", indice: i });
    }
    return e;
  };

  it("le dice que lea el documento sobre su escritorio", () => {
    const texto = mensajeGuia(recorrido()).toLowerCase();
    expect(texto).toContain("terminó");
    expect(texto).toContain("review");
    expect(texto).toContain("documento");
  });

  it("mientras lee un documento, la guía se calla", () => {
    const e = reducir(recorrido(), { tipo: "abrirDocumento", indice: 0 });
    expect(mensajeGuia(e)).toBe("");
  });
});

describe("la guía al pasar al siguiente agente", () => {
  it("le dice que ahora le toca al agente 2 y que puede leer el documento del anterior", () => {
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    e = reducir(e, { tipo: "ordenarCorrer", indice: 0 });
    e = reducir(e, { tipo: "terminarCorrida", indice: 0 });
    const texto = mensajeGuia(e).toLowerCase();
    expect(texto).toContain("agente 2");
    expect(texto).toContain("generate");
    expect(texto).toContain("documento");
  });
});

describe("la guía en la pantalla final", () => {
  it("se calla: ahí manda la pantalla final", () => {
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    for (let i = 0; i < 8; i++) {
      e = reducir(e, { tipo: "ordenarCorrer", indice: i });
      e = reducir(e, { tipo: "terminarCorrida", indice: i });
    }
    e = reducir(reducir(e, { tipo: "abrirDocumento", indice: 7 }), { tipo: "cerrarDocumento" });
    expect(e.fin).toBe(true);
    expect(mensajeGuia(e)).toBe("");
  });
});
