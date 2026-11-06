import { describe, expect, it } from "vitest";
import { soportaWebGL } from "../src/escena";

describe("detectar si el navegador puede mostrar 3D", () => {
  it("sin navegador (como en los tests) dice que no, en vez de romperse", () => {
    expect(soportaWebGL()).toBe(false);
  });
});
