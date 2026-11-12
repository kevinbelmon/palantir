import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ESTADO_INICIAL, reducir, type Estado } from "../src/flujo";
import { CARTEL_CENTRAL } from "../src/oficina";
import { BarraSuperior } from "../src/ui/BarraSuperior";

const terminar = (e: Estado, i: number) => reducir(reducir(e, { tipo: "ordenarCorrer", indice: i }), { tipo: "terminarCorrida", indice: i });

describe("la barra superior", () => {
  it("muestra el nombre del modelo y su lema", () => {
    const html = renderToString(<BarraSuperior estado={ESTADO_INICIAL} />);
    expect(html).toContain("Spec-Driven Development");
    expect(html).toContain(CARTEL_CENTRAL.lema);
  });

  it("al empezar pide dejar el brief", () => {
    expect(renderToString(<BarraSuperior estado={ESTADO_INICIAL} />)).toContain("Dejá el brief");
  });

  it("dice en qué paso va y de cuántos, con el nombre del agente", () => {
    const e = terminar(reducir(ESTADO_INICIAL, { tipo: "dejarBrief" }), 0);
    const html = renderToString(<BarraSuperior estado={e} />);
    expect(html).toContain("Paso 2 de 8");
    expect(html).toContain("Generate");
  });

  it("tiene una barra de progreso accesible con el avance", () => {
    const e = terminar(reducir(ESTADO_INICIAL, { tipo: "dejarBrief" }), 0);
    const html = renderToString(<BarraSuperior estado={e} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="8"');
  });

  it("al terminar los 8 dice que el recorrido está completo", () => {
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    for (let i = 0; i < 8; i++) e = terminar(e, i);
    expect(renderToString(<BarraSuperior estado={e} />)).toContain("Recorrido completo");
  });
});
