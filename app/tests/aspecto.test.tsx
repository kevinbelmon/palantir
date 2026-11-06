import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ESTADO_INICIAL } from "../src/flujo";
import { BarraSuperior } from "../src/ui/BarraSuperior";
import { BotonMusica } from "../src/ui/BotonMusica";

const emoji = /\p{Extended_Pictographic}/u;

describe("aspecto moderno, sin emojis", () => {
  it("la barra de arriba tiene el logo dibujado y ningún emoji", () => {
    const h = renderToString(<BarraSuperior estado={ESTADO_INICIAL} />);
    expect(h).toContain("<svg");
    expect(h).toContain("Spec-Driven Development");
    expect(emoji.test(h)).toBe(false);
  });

  it("el botón de música tiene ícono dibujado y texto, en sus dos estados", () => {
    for (const silenciada of [false, true]) {
      const h = renderToString(<BotonMusica silenciada={silenciada} alAlternar={() => {}} />);
      expect(h).toContain("<svg");
      expect(h).toContain(silenciada ? "Música apagada" : "Música");
      expect(emoji.test(h)).toBe(false);
    }
  });


  it("los carteles del mundo (2D y 3D) se dibujan sin emojis", () => {
    for (const f of ["src/escena/texturas.ts", "src/escena/mundo3d.ts", "src/oficina/dibujo.ts"]) {
      const lineas = readFileSync(f, "utf8").split("\n");
      lineas.forEach((l, i) => expect(emoji.test(l), `${f}:${i + 1}`).toBe(false));
    }
  });
});
