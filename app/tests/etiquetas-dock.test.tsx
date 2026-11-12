import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { etiquetaDeEstado, textoEtiqueta } from "../src/contenido";
import { AGENTES, ESTADO_INICIAL, reducir, resumenDock, type Estado } from "../src/flujo";
import { posicionEtiqueta, SALAS } from "../src/oficina";
import { Dock } from "../src/ui/Dock";

const terminar = (e: Estado, i: number) => reducir(reducir(e, { tipo: "ordenarCorrer", indice: i }), { tipo: "terminarCorrida", indice: i });
const conBrief = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });

describe("la etiqueta que flota sobre cada personaje", () => {
  it("lleva el nombre de su comando", () => {
    AGENTES.forEach((a, i) => expect(textoEtiqueta(i)).toBe(a.comando));
  });

  it("queda arriba de la cabeza, adentro de su sala", () => {
    SALAS.forEach((s) => {
      const r = posicionEtiqueta(s);
      expect(r.x).toBeCloseTo(s.personaje.x - r.w / 2);
      expect(r.y + r.h).toBeLessThan(s.personaje.y - 86);
      expect(r.x).toBeGreaterThan(s.area.x);
      expect(r.x + r.w).toBeLessThan(s.area.x + s.area.w);
      expect(r.y).toBeGreaterThan(s.area.y);
    });
  });
});

describe("el estado que muestra cada agente", () => {
  it("tiene un texto y un color distinto para cada estado", () => {
    const e = (["deshabilitado", "habilitado", "corriendo", "terminado"] as const).map(etiquetaDeEstado);
    expect(new Set(e.map((x) => x.texto)).size).toBe(4);
    expect(new Set(e.map((x) => x.color)).size).toBe(4);
    expect(etiquetaDeEstado("habilitado")).toMatchObject({ texto: "Te toca", color: "verde" });
    expect(etiquetaDeEstado("corriendo")).toMatchObject({ texto: "Trabajando", color: "amarillo" });
  });
});

describe("los contadores del dock", () => {
  it("al empezar faltan las 8 tareas y te toca dejar el brief", () => {
    expect(resumenDock(ESTADO_INICIAL)).toEqual({ tareas: 8, teToca: 1 });
  });

  it("con el brief dejado te toca ordenarle al primer agente", () => {
    expect(resumenDock(conBrief)).toEqual({ tareas: 8, teToca: 1 });
  });

  it("mientras un agente trabaja, no te toca nada", () => {
    expect(resumenDock(reducir(conBrief, { tipo: "ordenarCorrer", indice: 0 }))).toEqual({ tareas: 8, teToca: 0 });
  });

  it("al terminar uno, falta una tarea menos y te toca el siguiente", () => {
    expect(resumenDock(terminar(conBrief, 0))).toEqual({ tareas: 7, teToca: 1 });
  });

  it("al terminar los 8 no falta nada ni te toca nada", () => {
    let e = conBrief;
    for (let i = 0; i < 8; i++) e = terminar(e, i);
    expect(resumenDock(e)).toEqual({ tareas: 0, teToca: 0 });
  });
});

describe("el dock de abajo", () => {
  const html = (e: Estado) => renderToString(<Dock estado={e} alElegir={() => {}} alNuevo={() => {}} />);

  it("muestra a los 8 agentes con su nombre", () => {
    const h = html(conBrief);
    for (const nombre of ["Refine", "Generate", "Validate", "Log", "Implement", "E2E", "Checklist", "Review"]) expect(h).toContain(nombre);
  });

  it("dice el estado de cada uno, para quien usa lector de pantalla", () => {
    const h = html(conBrief);
    expect(h).toContain("Refine: Te toca");
    expect(h).toContain("Generate: En espera");
  });

  it("marca con un número rojo al agente al que le toca", () => {
    expect(html(conBrief)).toContain('data-insignia="1"');
    expect(html(reducir(conBrief, { tipo: "ordenarCorrer", indice: 0 }))).not.toContain('data-insignia="1"');
  });

  it("muestra los contadores de tareas y de «te toca»", () => {
    const h = html(terminar(conBrief, 0));
    expect(h).toContain("Pendientes");
    expect(h).toContain("Te toca");
    expect(h).toMatch(/data-contador="tareas"[^>]*>7</);
  });

  it("tiene el botón «Nuevo»", () => {
    expect(html(ESTADO_INICIAL)).toContain("Nuevo");
  });
});
