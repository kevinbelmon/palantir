import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { oracionMasLarga, palabrasTecnicas, textosDe } from "../src/contenido";
import { AGENTES, ESTADO_INICIAL, reducir } from "../src/flujo";
import { PasoAPaso } from "../src/ui/PasoAPaso";

const palabras = (s: string) => s.trim().split(/\s+/).length;

describe("la frase corta de cada comando", () => {
  it("es una sola oración corta, de entre 6 y 18 palabras", () => {
    for (const a of AGENTES) {
      const r = textosDe(a.id).resumen;
      expect(palabras(r), a.id).toBeGreaterThanOrEqual(6);
      expect(palabras(r), a.id).toBeLessThanOrEqual(18);
      expect(oracionMasLarga(r), a.id).toBe(palabras(r));
      expect(r.endsWith("."), a.id).toBe(true);
    }
  });

  it("no usa jerga de programación", () => {
    for (const a of AGENTES) expect(palabrasTecnicas(textosDe(a.id).resumen), a.id).toEqual([]);
  });
});

describe("el panel «Paso a paso»", () => {
  const html = (abierto: number | null, estado = ESTADO_INICIAL) => renderToString(<PasoAPaso estado={estado} abierto={abierto} alElegir={() => {}} />);

  it("lista los 8 comandos en orden", () => {
    const h = html(null);
    expect(h).toContain("Paso a paso");
    const posiciones = AGENTES.map((a) => h.indexOf(a.comando));
    expect(posiciones.every((p) => p >= 0)).toBe(true);
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
  });

  it("tiene un botón por comando, todos cerrados al empezar y sin frases", () => {
    const h = html(null);
    expect(h.match(/aria-expanded="false"/g)).toHaveLength(8);
    expect(h).not.toContain('aria-expanded="true"');
    for (const a of AGENTES) expect(h).not.toContain(textosDe(a.id).resumen);
  });

  it("al abrir uno muestra solo su frase corta", () => {
    const h = html(2);
    expect(h.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(h).toContain(textosDe(AGENTES[2].id).resumen);
    expect(h).not.toContain(textosDe(AGENTES[3].id).resumen);
  });

  it("muestra el estado de cada uno: en espera, te toca y listo", () => {
    const e = reducir(reducir(reducir(ESTADO_INICIAL, { tipo: "dejarBrief" }), { tipo: "ordenarCorrer", indice: 0 }), { tipo: "terminarCorrida", indice: 0 });
    const h = html(null, e);
    expect(h).toContain("Listo");
    expect(h).toContain("Te toca");
    expect(h).toContain("En espera");
  });
});
