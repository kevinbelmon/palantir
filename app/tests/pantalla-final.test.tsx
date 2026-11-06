import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AGENTES } from "../src/flujo";
import { textosDe } from "../src/contenido";
import { PantallaFinal } from "../src/ui/PantallaFinal";

describe("la pantalla final", () => {
  const html = renderToString(<PantallaFinal alReiniciar={() => {}} />);

  it("felicita a la persona, en español", () => {
    expect(html).toContain("Terminaste");
  });

  it("repasa los 8 pasos, en orden, con su nombre", () => {
    let desde = 0;
    for (const a of AGENTES) {
      const nombre = textosDe(a.id).nombre;
      const pos = html.indexOf(nombre, desde);
      expect(pos, nombre).toBeGreaterThanOrEqual(desde);
      desde = pos;
    }
  });

  it("explica la idea del modelo con el lema", () => {
    expect(html).toContain("Planear primero. Construir después.");
  });

  it("tiene el botón para jugar de nuevo", () => {
    expect(html).toContain("Jugar de nuevo");
  });
});
