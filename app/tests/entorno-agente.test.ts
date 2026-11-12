import { describe, expect, it } from "vitest";
import { entornoDelAgente } from "../servidor/agentes";

describe("el entorno con el que corre el agente", () => {
  it("saca las claves de API sueltas para usar la sesión de la persona, y deja el resto", () => {
    const e = entornoDelAgente({ ANTHROPIC_API_KEY: "sk-vieja", ANTHROPIC_AUTH_TOKEN: "t", PATH: "/bin", HOME: "/h" });
    expect(e.ANTHROPIC_API_KEY).toBeUndefined();
    expect(e.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
    expect(e.PATH).toBe("/bin");
    expect(e.HOME).toBe("/h");
  });

  it("no modifica el entorno original", () => {
    const original = { ANTHROPIC_API_KEY: "sk-vieja" };
    entornoDelAgente(original);
    expect(original.ANTHROPIC_API_KEY).toBe("sk-vieja");
  });

  it("respeta la clave si la persona pide usarla a propósito", () => {
    const e = entornoDelAgente({ ANTHROPIC_API_KEY: "sk-mia", SDD_USAR_API_KEY: "1" });
    expect(e.ANTHROPIC_API_KEY).toBe("sk-mia");
  });
});
