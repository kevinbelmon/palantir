import { describe, expect, it } from "vitest";
import config from "../vite.config";

describe("configuración de Vite", () => {
  it("levanta en el puerto fijo 5173", () => {
    expect(config.server?.port).toBe(5173);
  });

  it("falla con un aviso si el puerto está ocupado, en vez de elegir otro", () => {
    expect(config.server?.strictPort).toBe(true);
  });
});
