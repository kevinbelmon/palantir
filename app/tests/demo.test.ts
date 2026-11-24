import { describe, expect, it } from "vitest";
import { oracionMasLarga, palabrasTecnicas } from "../src/contenido";
import { CIERRE_DEMO, DIALOGOS_DEMO, DOCUMENTOS_DEMO, INTRO_DEMO, NARRACION_DEMO } from "../src/contenido/demo";
import { AGENTES } from "../src/flujo";
import { construirGuion, duracionTotal, msEscribiendo, msPersona, vistaEn } from "../src/flujo/guionDemo";

const guion = construirGuion();

describe("el guion de la demo", () => {
  it("empieza por el brief y después recorre los ocho agentes en orden", () => {
    const ordenes = guion.filter((p) => p.tipo === "ordenar").map((p) => p.indice);
    expect(ordenes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    const brief = guion.findIndex((p) => p.tipo === "dejarBrief");
    expect(brief).toBeGreaterThan(0);
    expect(guion.findIndex((p) => p.tipo === "ordenar")).toBeGreaterThan(brief);
  });

  it("cada agente corre y termina una sola vez", () => {
    const abrir = guion.filter((p) => p.tipo === "abrirAgente").map((p) => p.indice);
    const terminar = guion.filter((p) => p.tipo === "terminar").map((p) => p.indice);
    expect(new Set(abrir).size).toBe(AGENTES.length);
    expect(abrir).toEqual(AGENTES.map((_, i) => i));
    expect(terminar).toEqual(abrir);
  });

  it("dura entre tres y cuatro minutos a velocidad normal", () => {
    const total = duracionTotal(guion);
    expect(total).toBeGreaterThan(180_000);
    expect(total).toBeLessThanOrEqual(240_000);
  });

  it("cada agente tiene entre tres y seis intercambios, y todos son cortos", () => {
    for (const agente of AGENTES) {
      const cambios = DIALOGOS_DEMO[agente.id];
      expect(cambios.length).toBeGreaterThanOrEqual(3);
      expect(cambios.length).toBeLessThanOrEqual(6);
      for (const c of cambios) {
        expect(c.agente.trim().length).toBeGreaterThan(0);
        expect(c.persona.trim().length).toBeGreaterThan(0);
        expect(c.agente.length).toBeLessThan(120);
        expect(c.persona.length).toBeLessThan(100);
      }
    }
  });

  it("los tiempos de escritura son humanos y crecen con el largo del mensaje", () => {
    expect(msEscribiendo("Hola.")).toBeGreaterThanOrEqual(1000);
    expect(msEscribiendo("x".repeat(400))).toBeLessThanOrEqual(2400);
    expect(msEscribiendo("un mensaje bastante largo para probar")).toBeGreaterThan(msEscribiendo("hola"));
    expect(msPersona("Sí, mi familia.")).toBeGreaterThan(700);
  });

  it("al final los ocho terminaron y queda la pantalla del recorrido", () => {
    const vista = vistaEn(duracionTotal(guion), guion);
    expect(vista.estado.agentes.every((a) => a === "terminado")).toBe(true);
    expect(vista.estado.fin).toBe(true);
    expect(vista.columna).toBe("final");
  });

  it("el brief queda dejado y hay oficinas en marcha antes del minuto y medio", () => {
    const vista = vistaEn(90_000, guion);
    expect(vista.estado.briefDejado).toBe(true);
    expect(vista.estado.agentes.filter((a) => a === "terminado").length).toBeGreaterThan(0);
  });

  it("la cámara va pasando por las oficinas y no repite el mismo viaje", () => {
    const viajes: number[] = [];
    for (let t = 0; t <= duracionTotal(guion); t += 500) {
      const e = vistaEn(t, guion).enfoque;
      if (e && viajes[viajes.length - 1] !== e.indice) viajes.push(e.indice);
    }
    expect(viajes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("el mismo instante da siempre la misma vista", () => {
    expect(JSON.stringify(vistaEn(42_000, guion))).toBe(JSON.stringify(vistaEn(42_000, guion)));
  });

  it("la persona tipea antes de que su mensaje aparezca en el chat", () => {
    const paso = guion.findIndex((p) => p.tipo === "personaEscribiendo");
    let inicio = 0;
    for (let i = 0; i < paso; i++) inicio += guion[i].ms;
    const enElMedio = vistaEn(inicio + guion[paso].ms / 2, guion);
    const alFinal = vistaEn(inicio + guion[paso].ms + 1, guion);
    expect(enElMedio.borrador.length).toBeGreaterThan(0);
    expect(alFinal.borrador).toBe("");
  });
});

describe("los textos de la demo", () => {
  const todos: string[] = [
    ...INTRO_DEMO.flatMap((c) => [c.titulo, c.texto]),
    ...CIERRE_DEMO.flatMap((c) => [c.titulo, c.texto]),
    ...AGENTES.flatMap((a) => [NARRACION_DEMO[a.id], ...DIALOGOS_DEMO[a.id].flatMap((c) => [c.agente, c.persona])]),
    ...AGENTES.flatMap((a) => DOCUMENTOS_DEMO[a.id].bloques.flatMap((b) => [b.encabezado, ...b.lineas])),
  ];

  it("no usa palabras de programación", () => {
    for (const texto of todos) expect({ texto, jerga: palabrasTecnicas(texto) }).toEqual({ texto, jerga: [] });
  });

  it("las oraciones tienen treinta palabras o menos", () => {
    for (const texto of todos) {
      expect({ texto, oracion: oracionMasLarga(texto) }).toEqual({ texto, oracion: expect.any(Number) });
      expect(oracionMasLarga(texto)).toBeLessThanOrEqual(30);
    }
  });

  it("cada agente tiene su explicación y su documento", () => {
    for (const a of AGENTES) {
      expect(NARRACION_DEMO[a.id].length).toBeGreaterThan(20);
      expect(DOCUMENTOS_DEMO[a.id].titulo.length).toBeGreaterThan(0);
      expect(DOCUMENTOS_DEMO[a.id].bloques.length).toBeGreaterThan(0);
    }
  });
});
