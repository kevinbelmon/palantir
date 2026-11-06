import { describe, expect, it } from "vitest";
import { textosDe } from "../src/contenido";
import { AGENTES, type AgenteId } from "../src/flujo";

// Qué documento tiene que dejar cada agente, según la spec (US-5).
const ESPERADO: Record<AgenteId, string> = {
  refine: "brief",
  generate: "plan",
  validate: "huecos",
  log: "decisión",
  implement: "código",
  e2e: "evidencia",
  checklist: "verificación",
  review: "verificación final",
};

describe("el documento de cada agente", () => {
  it("cada agente deja el documento que le corresponde", () => {
    for (const a of AGENTES) {
      expect(textosDe(a.id).documento.titulo.toLowerCase(), a.id).toContain(ESPERADO[a.id]);
    }
  });

  it("tiene al menos dos secciones, con renglones adentro", () => {
    for (const a of AGENTES) {
      const d = textosDe(a.id).documento;
      expect(d.bloques.length, a.id).toBeGreaterThanOrEqual(2);
      for (const b of d.bloques) {
        expect(b.encabezado.length, a.id).toBeGreaterThan(3);
        expect(b.lineas.length, `${a.id} / ${b.encabezado}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("todos usan el ejemplo de los gastos entre amigos", () => {
    for (const a of AGENTES) {
      const texto = JSON.stringify(textosDe(a.id).documento).toLowerCase();
      expect(texto, a.id).toMatch(/gasto|amigo|cuenta/);
    }
  });

  it("el generate muestra los cuatro documentos del plan", () => {
    const encabezados = textosDe("generate").documento.bloques.map((b) => b.encabezado.toLowerCase()).join(" | ");
    for (const nombre of ["reglas", "historias", "plan", "tareas"]) expect(encabezados).toContain(nombre);
  });
});
