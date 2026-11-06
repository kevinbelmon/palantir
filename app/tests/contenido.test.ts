import { describe, expect, it } from "vitest";
import { AGENTES } from "../src/flujo";
import { textosDe } from "../src/contenido";

describe("lo que dice cada agente", () => {
  it("tiene globito, explicación, utilidad y aviso de que terminó", () => {
    for (const a of AGENTES) {
      const t = textosDe(a.id);
      expect(t.globito.length, `${a.id} globito`).toBeGreaterThanOrEqual(30);
      expect(t.queHace.length, `${a.id} queHace`).toBeGreaterThanOrEqual(30);
      expect(t.paraQueSirve.length, `${a.id} paraQueSirve`).toBeGreaterThanOrEqual(30);
      expect(t.listo.length, `${a.id} listo`).toBeGreaterThanOrEqual(20);
    }
  });

  it("el globito está en primera persona: el agente cuenta lo que está haciendo", () => {
    for (const a of AGENTES) expect(textosDe(a.id).globito, a.id).toMatch(/\b(Estoy|Voy|Reviso|Armo|Comparo|Anoto|Escribo|Abro|Pruebo|Miro|Repaso|Leo|Hago)\b/);
  });
});
