import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PanelAgente } from "../src/ui/PanelAgente";

const base = { indice: 0, briefDejado: true, alOrdenar: () => {}, alCerrar: () => {} };

describe("el panel de un agente", () => {
  it("muestra su nombre, qué hace y para qué sirve", () => {
    const html = renderToString(<PanelAgente {...base} estado="habilitado" />);
    expect(html).toContain("Refine");
    expect(html).toContain("/sdd-refine");
    expect(html.toLowerCase()).toContain("para qué sirve");
  });

  it("si está habilitado, deja ordenarle que corra", () => {
    const html = renderToString(<PanelAgente {...base} estado="habilitado" />);
    expect(html).toContain("Ordenar que corra");
    expect(html).not.toContain("disabled");
  });

  it("si está corriendo, avisa que está trabajando y no deja ordenar de nuevo", () => {
    const html = renderToString(<PanelAgente {...base} estado="corriendo" />);
    expect(html).toContain("Trabajando");
    expect(html).not.toContain("Ordenar que corra");
  });

  it("si ya terminó, lo dice", () => {
    const html = renderToString(<PanelAgente {...base} estado="terminado" />);
    expect(html.toLowerCase()).toContain("ya terminó");
  });

  it("si todavía no hay brief, explica que primero hay que dejarlo", () => {
    const html = renderToString(<PanelAgente {...base} indice={0} briefDejado={false} estado="deshabilitado" />);
    expect(html.toLowerCase()).toContain("primero dejá el brief");
  });

  it("si es el turno de otro, explica que tiene que terminar el anterior", () => {
    const html = renderToString(<PanelAgente {...base} indice={3} estado="deshabilitado" />);
    expect(html.toLowerCase()).toContain("tiene que terminar");
    expect(html).toContain("Validate");
  });
});
