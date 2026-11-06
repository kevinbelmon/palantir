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

describe("la dirección donde escucha", () => {
  it("usa la dirección IPv4 de esta computadora, así detecta un puerto ocupado de verdad", () => {
    // Con "localhost" Vite puede escuchar en IPv6 y convivir en silencio con otra app en IPv4.
    expect(config.server?.host).toBe("127.0.0.1");
  });
});
