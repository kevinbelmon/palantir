import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contextoDelBot, NOMBRE_BOT, oracionMasLarga, palabrasTecnicas, tarjetasBot, type ContextoBot } from "../src/contenido";
import { AGENTES, ESTADO_INICIAL, reducir } from "../src/flujo";
import { Bot } from "../src/ui/Bot";

const todosLosTemas: ContextoBot[] = [{ tipo: "intro" }, { tipo: "fin" }, ...AGENTES.map((_, indice) => ({ tipo: "agente" as const, indice }))];

describe("el bot guía", () => {
  it("se llama Zac", () => {
    expect(NOMBRE_BOT).toBe("Zac");
  });

  it("explica cada comando en cinco tarjetas: qué es, qué hace, qué hacés vos, cómo sé que terminó y si te trabás", () => {
    for (const a of AGENTES) {
      const t = tarjetasBot({ tipo: "agente", indice: a.numero - 1 });
      expect(t, a.id).toHaveLength(5);
      expect(t[0].titulo.startsWith("¿Qué es "), a.id).toBe(true);
      expect(t.slice(1).map((x) => x.titulo), a.id).toEqual(["¿Qué hace el agente?", "¿Qué hacés vos?", "¿Cómo sé que terminó?", "Si te trabás"]);
    }
  });

  it("en la primera tarjeta de cada comando dice qué significa su nombre", () => {
    for (const a of AGENTES) expect(tarjetasBot({ tipo: "agente", indice: a.numero - 1 })[0].texto, a.id).toContain("significa");
  });

  it("en la tarea de cada comando dice qué tocar (o que el paso es de la persona)", () => {
    for (const a of AGENTES) {
      const tarea = tarjetasBot({ tipo: "agente", indice: a.numero - 1 })[2].texto;
      expect(tarea.includes("Tocá") || tarea.includes("Este paso es tuyo"), a.id).toBe(true);
    }
  });

  it("no usa jerga de programación y mantiene las oraciones cortas", () => {
    for (const tema of todosLosTemas) {
      for (const tarjeta of tarjetasBot(tema)) {
        const texto = `${tarjeta.titulo}. ${tarjeta.texto}`;
        expect(palabrasTecnicas(texto), texto).toEqual([]);
        expect(oracionMasLarga(texto), texto).toBeLessThanOrEqual(30);
      }
    }
  });

  it("elige de qué hablar: lo que la persona tocó manda; si no, el paso en el que está", () => {
    expect(contextoDelBot(ESTADO_INICIAL, null)).toEqual({ tipo: "intro" });
    let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
    expect(contextoDelBot(e, null)).toEqual({ tipo: "agente", indice: 0 });
    expect(contextoDelBot(e, 3)).toEqual({ tipo: "agente", indice: 3 });
    e = reducir(e, { tipo: "ordenarCorrer", indice: 0 });
    expect(contextoDelBot(e, null)).toEqual({ tipo: "agente", indice: 0 });
    for (let i = 0; i < AGENTES.length; i++) {
      if (i > 0) e = reducir(e, { tipo: "ordenarCorrer", indice: i });
      e = reducir(e, { tipo: "terminarCorrida", indice: i });
    }
    // con los ocho terminados, el bot felicita aunque todavía no se haya mirado la pantalla final
    expect(contextoDelBot(e, null)).toEqual({ tipo: "fin" });
    e = reducir(reducir(e, { tipo: "abrirDocumento", indice: AGENTES.length - 1 }), { tipo: "cerrarDocumento" });
    expect(e.fin).toBe(true);
    expect(contextoDelBot(e, 2)).toEqual({ tipo: "fin" });
  });

  it("se ve en la esquina, con su nombre y la primera tarjeta", () => {
    const html = renderToString(<Bot contexto={{ tipo: "intro" }} />);
    expect(html).toContain("tu guía");
    expect(html).toContain('aria-label="Zac, el bot guía"');
    expect(html).toContain("tu asistente");
    expect(html).toContain("Siguiente");
    expect(html).toContain("1 de 5");
  });

  it("al hablar de un comando muestra cuál es", () => {
    const html = renderToString(<Bot contexto={{ tipo: "agente", indice: 4 }} />);
    expect(html).toContain("/sdd-implement");
    expect(html).toContain("¿Qué es Implement?");
  });
});
