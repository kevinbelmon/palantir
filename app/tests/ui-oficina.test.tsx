import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("la pantalla del juego", () => {
  const html = renderToString(<App />);

  it("muestra el lienzo de la oficina", () => {
    expect(html).toContain("<canvas");
  });

  it("describe la oficina para lectores de pantalla, en español", () => {
    expect(html).toContain("aria-label=");
    expect(html.toLowerCase()).toContain("oficina");
  });
});
