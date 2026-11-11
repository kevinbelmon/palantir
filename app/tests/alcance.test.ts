import { describe, expect, it } from "vitest";
import { MUNDO, PAPELERIA, rectDocumento, SALAS, type Rect } from "../src/oficina";
import { entradaDeSala, JUGADOR_INICIAL, obstaculos, RADIO_JUGADOR, tocaRect } from "../src/escena/persona";

const P = 10;
const W = Math.ceil(MUNDO.ancho / P);
const H = Math.ceil(MUNDO.alto / P);

/** Marca todo lo que se puede pisar caminando desde el punto de arranque, con las mismas colisiones del juego. */
function alcanzable(desde: { x: number; z: number }) {
  const obs = obstaculos();
  const libre = (i: number, j: number) => {
    const x = i * P;
    const z = j * P;
    return x > 40 && z > 40 && x < MUNDO.ancho - 40 && z < MUNDO.alto - 40 && !obs.some((c) => tocaRect(x, z, RADIO_JUGADOR, c));
  };
  const visto = new Uint8Array(W * H);
  const cola = [Math.round(desde.x / P), Math.round(desde.z / P)];
  visto[cola[1] * W + cola[0]] = 1;
  for (let k = 0; k < cola.length; k += 2) {
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const i = cola[k] + a;
      const j = cola[k + 1] + b;
      if (i < 0 || j < 0 || i >= W || j >= H || visto[j * W + i] || !libre(i, j)) continue;
      visto[j * W + i] = 1;
      cola.push(i, j);
    }
  }
  const llega = (x: number, z: number) => visto[Math.round(z / P) * W + Math.round(x / P)] === 1;
  const proporcion = (r: Rect) => {
    let libres = 0;
    let ok = 0;
    for (let x = r.x; x < r.x + r.w; x += P) {
      for (let z = r.y; z < r.y + r.h; z += P) {
        if (!libre(Math.round(x / P), Math.round(z / P))) continue;
        libres++;
        if (llega(x, z)) ok++;
      }
    }
    return { libres, ok };
  };
  return { llega, proporcion };
}

describe("se puede llegar a todos lados caminando desde el lobby", () => {
  const { llega, proporcion } = alcanzable(JUGADOR_INICIAL);

  it("cada oficina se recorre entera, incluso detrás del escritorio", () => {
    for (const s of SALAS) {
      const { libres, ok } = proporcion(s.area);
      expect(libres, `sala ${s.numero}`).toBeGreaterThan(500);
      expect(ok / libres, `sala ${s.numero}`).toBeGreaterThan(0.98);
    }
  });

  it("la papelería también", () => {
    const { libres, ok } = proporcion(PAPELERIA);
    expect(ok / libres).toBeGreaterThan(0.98);
  });

  it("se llega a donde se aparece al entrar a cada oficina y a cada agente", () => {
    for (const s of SALAS) {
      const e = entradaDeSala(s);
      expect(llega(e.x, e.z), `entrada sala ${s.numero}`).toBe(true);
      // un paso delante de cada agente y de su documento, para hablarle o leerlo
      const d = rectDocumento(s);
      const delante = s.tipo === "vidrio" ? { x: s.escritorio.x + s.escritorio.w / 2, z: s.escritorio.y - 60 } : { x: d.x + d.w / 2, z: s.escritorio.y + s.escritorio.h + 60 };
      expect(proporcion({ x: delante.x - 80, y: delante.z - 80, w: 160, h: 160 }).ok, `delante sala ${s.numero}`).toBeGreaterThan(0);
    }
  });
});

describe("los pasillos son anchos de verdad", () => {
  it("entre las oficinas y el lobby entran dos personas una al lado de la otra", () => {
    const top = Math.max(...SALAS.filter((s) => s.area.y < 600 && s.tipo !== "vidrio").map((s) => s.area.y + s.area.h));
    const bajo = Math.min(...SALAS.filter((s) => s.area.y > 1100 && s.tipo !== "vidrio").map((s) => s.area.y));
    const lobbyAbajo = 1120;
    expect(PAPELERIA.y - top).toBeGreaterThanOrEqual(140);
    expect(bajo - lobbyAbajo).toBeGreaterThanOrEqual(140);
  });
});
