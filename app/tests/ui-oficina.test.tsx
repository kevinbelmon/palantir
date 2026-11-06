import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("la pantalla del juego", () => {
  const html = renderToString(<App />);

  it("muestra el lienzo de la oficina", () => {
    expect(html).toContain("<canvas");
  });

  it("le explica a la persona cómo mover la cámara, en palabras simples", () => {
    const texto = html.toLowerCase();
    expect(texto).toContain("clic derecho");
    expect(texto).toContain("rueda");
  });

  it("al empezar, la guía le pide dejar el brief en la papelería", () => {
    expect(html.toLowerCase()).toContain("papelería");
    expect(html.toLowerCase()).toContain("brief");
  });

  it("describe la oficina para lectores de pantalla, en español", () => {
    expect(html).toContain("aria-label=");
    expect(html.toLowerCase()).toContain("oficina");
  });
});
