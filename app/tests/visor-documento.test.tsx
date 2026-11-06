import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AGENTES } from "../src/flujo";
import { textosDe } from "../src/contenido";
import { VisorDocumento } from "../src/ui/VisorDocumento";

describe("el visor de documentos", () => {
  it("muestra el título y todos los renglones del documento", () => {
    const html = renderToString(<VisorDocumento indice={0} alCerrar={() => {}} />);
    const d = textosDe("refine").documento;
    expect(html).toContain(d.titulo.replace(/&/g, "&amp;"));
    for (const b of d.bloques) {
      expect(html).toContain(b.encabezado);
      for (const l of b.lineas) expect(html).toContain(l.replace(/'/g, "&#x27;"));
    }
  });

  it("dice de qué agente es y tiene un botón para cerrar", () => {
    const html = renderToString(<VisorDocumento indice={2} alCerrar={() => {}} />);
    expect(html).toContain("Validate");
    expect(html).toContain("Cerrar");
  });

  it("funciona con los 8 agentes", () => {
    AGENTES.forEach((_, i) => {
      expect(() => renderToString(<VisorDocumento indice={i} alCerrar={() => {}} />)).not.toThrow();
    });
  });
});
