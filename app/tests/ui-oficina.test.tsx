import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("la pantalla del juego", () => {
  const html = renderToString(<App />);

  it("muestra el lienzo de la oficina", () => {
    expect(html).toContain("<canvas");
  });

  it("no muestra un cartel de ayuda con el texto de la cámara (el gesto sigue funcionando)", () => {
    const texto = html.toLowerCase();
    expect(texto).not.toContain("clic derecho");
    expect(texto).not.toContain("rueda");
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
