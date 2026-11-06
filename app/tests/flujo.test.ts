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

describe("abrir y cerrar el documento de un agente", () => {
  const corrida = (n: number) => {
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    e = reducir(e, { tipo: "ordenarCorrer", indice: 0 });
    return n === 0 ? e : reducir(e, { tipo: "terminarCorrida", indice: 0 });
  };

  it("al principio no hay ningún documento abierto", () => {
    expect(ESTADO_INICIAL.documentoAbierto).toBeNull();
  });

  it("se abre el documento de un agente que terminó", () => {
    const e = reducir(corrida(1), { tipo: "abrirDocumento", indice: 0 });
    expect(e.documentoAbierto).toBe(0);
  });

  it("no se abre el de uno que todavía no terminó", () => {
    expect(reducir(corrida(0), { tipo: "abrirDocumento", indice: 0 }).documentoAbierto).toBeNull();
    expect(reducir(corrida(1), { tipo: "abrirDocumento", indice: 4 }).documentoAbierto).toBeNull();
    expect(reducir(corrida(1), { tipo: "abrirDocumento", indice: 99 }).documentoAbierto).toBeNull();
  });

  it("se cierra", () => {
    const abierto = reducir(corrida(1), { tipo: "abrirDocumento", indice: 0 });
    expect(reducir(abierto, { tipo: "cerrarDocumento" }).documentoAbierto).toBeNull();
  });
});

describe("avanzar en orden", () => {
  const correr = (e: ReturnType<typeof reducir>, i: number) =>
    reducir(reducir(e, { tipo: "ordenarCorrer", indice: i }), { tipo: "terminarCorrida", indice: i });
  const inicio = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });

  it("al terminar un agente, el brief pasa al siguiente y solo ese se habilita", () => {
    const e = correr(inicio, 0);
    expect(e.agentes[0]).toBe("terminado");
    expect(e.agentes[1]).toBe("habilitado");
    expect(e.agentes.slice(2).every((a) => a === "deshabilitado")).toBe(true);
    expect(ubicacionBrief(e)).toEqual({ agente: 1 });
  });

  it("el siguiente queda esperando la orden: no corre solo", () => {
    expect(correr(inicio, 0).agentes[1]).not.toBe("corriendo");
  });

  it("no se puede saltear a un agente: el 3 no corre si el 2 no terminó", () => {
    const e = correr(inicio, 0);
    expect(reducir(e, { tipo: "ordenarCorrer", indice: 2 })).toEqual(e);
  });

  it("recorriendo los 8 en orden, el brief va de escritorio en escritorio", () => {
    let e = inicio;
    for (let i = 0; i < AGENTES.length; i++) {
      expect(e.agentes[i]).toBe("habilitado");
      expect(ubicacionBrief(e)).toEqual(i === 0 ? "papeleria" : { agente: i });
      e = correr(e, i);
    }
    expect(e.agentes.every((a) => a === "terminado")).toBe(true);
  });

  it("al terminar el último no se habilita nada más", () => {
    let e = inicio;
    for (let i = 0; i < AGENTES.length; i++) e = correr(e, i);
    expect(e.agentes).toHaveLength(AGENTES.length);
    expect(e.agentes.some((a) => a === "habilitado" || a === "corriendo")).toBe(false);
    expect(ubicacionBrief(e)).toEqual({ agente: AGENTES.length - 1 });
  });
});

describe("el final del recorrido", () => {
  const todosTerminados = () => {
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    for (let i = 0; i < AGENTES.length; i++) {
      e = reducir(e, { tipo: "ordenarCorrer", indice: i });
      e = reducir(e, { tipo: "terminarCorrida", indice: i });
    }
    return e;
  };

  it("al principio no hay pantalla final", () => {
    expect(ESTADO_INICIAL.fin).toBe(false);
  });

  it("terminar el último agente no alcanza: hay que leer y cerrar su documento", () => {
    expect(todosTerminados().fin).toBe(false);
    const abierto = reducir(todosTerminados(), { tipo: "abrirDocumento", indice: 7 });
    expect(abierto.fin).toBe(false);
  });

  it("al cerrar el documento del último agente aparece la pantalla final", () => {
    const e = reducir(reducir(todosTerminados(), { tipo: "abrirDocumento", indice: 7 }), { tipo: "cerrarDocumento" });
    expect(e.fin).toBe(true);
    expect(e.documentoAbierto).toBeNull();
  });

  it("cerrar el documento de otro agente no termina el juego", () => {
    const e = reducir(reducir(todosTerminados(), { tipo: "abrirDocumento", indice: 0 }), { tipo: "cerrarDocumento" });
    expect(e.fin).toBe(false);
  });

  it("si no terminaron todos, cerrar un documento no muestra el final", () => {
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    e = reducir(reducir(e, { tipo: "ordenarCorrer", indice: 0 }), { tipo: "terminarCorrida", indice: 0 });
    e = reducir(reducir(e, { tipo: "abrirDocumento", indice: 0 }), { tipo: "cerrarDocumento" });
    expect(e.fin).toBe(false);
  });

  it("jugar de nuevo reinicia todo: brief en la mano y nadie habilitado", () => {
    const fin = reducir(reducir(todosTerminados(), { tipo: "abrirDocumento", indice: 7 }), { tipo: "cerrarDocumento" });
    const nuevo = reducir(fin, { tipo: "reiniciar" });
    expect(nuevo).toEqual(ESTADO_INICIAL);
    expect(ubicacionBrief(nuevo)).toBe("mano");
  });
});
