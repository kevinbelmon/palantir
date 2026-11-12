import { describe, expect, it } from "vitest";
import { LOBBY, MUNDO, PAPELERIA, rectDocumento, SALAS, type Rect } from "../src/oficina";
import { entradaDeSala, JUGADOR_INICIAL, obstaculos, RADIO_JUGADOR, tocaRect } from "../src/escena/persona";

const P = 10;
const W = Math.ceil(MUNDO.ancho / P);
const H = Math.ceil(MUNDO.alto / P);

/**
 * Marca todo lo que se puede pisar caminando desde el punto de arranque, con las mismas colisiones del juego.
 * La grilla de bloqueo se calcula una sola vez: con una casa de 4000 × 2640, preguntar por los 150 obstáculos
 * en cada paso haría el test lentísimo.
 */
function alcanzable(desde: { x: number; z: number }) {
  const obs = obstaculos();
  const bloqueada = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const x = i * P;
      const z = j * P;
      const afuera = x <= 40 || z <= 40 || x >= MUNDO.ancho - 40 || z >= MUNDO.alto - 40;
      if (afuera || obs.some((c) => tocaRect(x, z, RADIO_JUGADOR, c))) bloqueada[j * W + i] = 1;
    }
  }
  const libre = (i: number, j: number) => i >= 0 && j >= 0 && i < W && j < H && bloqueada[j * W + i] === 0;

  const visto = new Uint8Array(W * H);
  const cola = [Math.round(desde.x / P), Math.round(desde.z / P)];
  visto[cola[1] * W + cola[0]] = 1;
  for (let k = 0; k < cola.length; k += 2) {
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const i = cola[k] + a;
      const j = cola[k + 1] + b;
      if (!libre(i, j) || visto[j * W + i]) continue;
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
      expect(libres, `sala ${s.numero}`).toBeGreaterThan(1500);
      expect(ok / libres, `sala ${s.numero}`).toBeGreaterThan(0.98);
    }
  });

  it("la papelería también", () => {
    const { libres, ok } = proporcion(PAPELERIA);
    expect(libres).toBeGreaterThan(800);
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

  it("el atrio, las dos columnatas y los dos rincones de estar se recorren", () => {
    const puntos = [
      { x: LOBBY.x + 380, y: LOBBY.y + 280 },
      { x: LOBBY.x + LOBBY.w - 380, y: LOBBY.y + 280 },
      { x: LOBBY.x + LOBBY.w / 2, y: LOBBY.y + LOBBY.h / 2 },
    ];
    for (const p of puntos) expect(llega(p.x, p.y), `${p.x},${p.y}`).toBe(true);
  });
});

describe("los pasillos son anchos de verdad", () => {
  it("entre las oficinas y el lobby entran dos personas una al lado de la otra", () => {
    const arriba = Math.max(...SALAS.filter((s) => s.area.y < LOBBY.y).map((s) => s.area.y + s.area.h));
    const abajo = Math.min(...SALAS.filter((s) => s.area.y > LOBBY.y).map((s) => s.area.y));
    expect(LOBBY.y - arriba).toBeGreaterThanOrEqual(200);
    expect(abajo - (LOBBY.y + LOBBY.h)).toBeGreaterThanOrEqual(200);
    expect(PAPELERIA.y - arriba).toBeGreaterThanOrEqual(200);
  });
});
