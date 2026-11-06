import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { acordeDelCompas, arpegioDelCompas, bajoDelCompas, CANCIONES, cancionPorId, crearReproductor, duracionDelCompas, melodiaDelCompas, ritmoDelCompas, texturaDelCompas, type ContextoDeAudio } from "../src/musica";
import { BotonMusica } from "../src/ui/BotonMusica";

describe("las canciones para elegir", () => {
  it("hay varias, con nombre y descripción distintos, y la primera es la de siempre", () => {
    expect(CANCIONES.length).toBeGreaterThanOrEqual(4);
    expect(new Set(CANCIONES.map((c) => c.id)).size).toBe(CANCIONES.length);
    expect(new Set(CANCIONES.map((c) => c.nombre)).size).toBe(CANCIONES.length);
    for (const c of CANCIONES) expect(c.descripcion.length).toBeGreaterThan(15);
    expect(CANCIONES[0].id).toBe("lofi");
  });

  it("una elección desconocida o vacía vuelve a la primera", () => {
    expect(cancionPorId("jazz").id).toBe("jazz");
    expect(cancionPorId("no-existe").id).toBe("lofi");
    expect(cancionPorId(null).id).toBe("lofi");
    expect(cancionPorId("").id).toBe("lofi");
  });

  for (const c of CANCIONES) {
    describe(c.nombre, () => {
      it("es tranquila: tempo moderado y notas graves o medias", () => {
        expect(c.bpm).toBeGreaterThanOrEqual(55);
        expect(c.bpm).toBeLessThanOrEqual(100);
        expect(c.progresion.length).toBeGreaterThanOrEqual(4);
        for (const acorde of c.progresion) {
          expect(acorde.length).toBeGreaterThanOrEqual(3);
          for (const n of acorde) {
            expect(n).toBeGreaterThanOrEqual(36);
            expect(n).toBeLessThanOrEqual(72);
          }
        }
      });

      it("todo cae adentro del compás y en orden", () => {
        const largo = duracionDelCompas(c);
        for (let compas = 0; compas < c.progresion.length * 3; compas++) {
          for (const lista of [bajoDelCompas(compas, c), texturaDelCompas(compas, c), melodiaDelCompas(compas, c)]) {
            lista.forEach((n, i) => {
              expect(n.tiempo).toBeGreaterThanOrEqual(0);
              expect(n.tiempo).toBeLessThan(largo);
              expect(n.duracion).toBeGreaterThan(0);
              if (i > 0 && lista === melodiaDelCompas(compas, c)) expect(n.tiempo).toBeGreaterThan(lista[i - 1].tiempo);
            });
          }
          for (const g of ritmoDelCompas(c)) {
            expect(g.tiempo).toBeGreaterThanOrEqual(0);
            expect(g.tiempo).toBeLessThan(largo);
            expect(g.fuerza).toBeGreaterThan(0);
            expect(g.fuerza).toBeLessThanOrEqual(1);
          }
        }
      });

      it("la melodía, si tiene, usa notas suaves y entra desde la segunda vuelta", () => {
        for (let compas = 0; compas < c.progresion.length; compas++) expect(melodiaDelCompas(compas, c)).toEqual([]);
        for (let compas = c.progresion.length; compas < c.progresion.length * 2; compas++) {
          for (const n of melodiaDelCompas(compas, c)) {
            expect(n.midi).toBeGreaterThanOrEqual(60);
            expect(n.midi).toBeLessThanOrEqual(76);
          }
        }
      });
    });
  }

  it("cada una suena distinto: el ritmo, el bajo y el acompañamiento no son los mismos en todas", () => {
    const huellas = CANCIONES.map((c) => JSON.stringify([c.ritmo, c.bajo, c.textura, c.bpm]));
    expect(new Set(huellas).size).toBe(CANCIONES.length);
  });

  it("el arpegio usa notas del acorde y el bajo caminando recorre el acorde", () => {
    const lluvia = cancionPorId("lluvia");
    for (const n of arpegioDelCompas(0, lluvia)) expect(acordeDelCompas(0, lluvia).some((a) => (n.midi - a) % 12 === 0)).toBe(true);
    const jazz = cancionPorId("jazz");
    expect(bajoDelCompas(0, jazz)).toHaveLength(4);
    expect(ritmoDelCompas(cancionPorId("lluvia"))).toEqual([]);
  });
});

// un sonido de mentira, para probar el reproductor sin placa de audio
const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} });
const nodo = () => ({ connect: () => nodo() });
function contextoFalso() {
  const c = {
    currentTime: 0,
    state: "running",
    destination: nodo(),
    osciladores: 0,
    filtros: [] as { frequency: { value: number } }[],
    cerrado: false,
    createOscillator: () => ((c.osciladores += 1), { ...nodo(), type: "sine", frequency: param(), start() {}, stop() {} }),
    createGain: () => ({ ...nodo(), gain: param() }),
    createBiquadFilter: () => {
      const f = { ...nodo(), type: "lowpass", frequency: param() };
      c.filtros.push(f);
      return f;
    },
    resume: () => Promise.resolve(),
    close: () => ((c.cerrado = true), Promise.resolve()),
  };
  return c;
}

describe("cambiar de canción en el reproductor", () => {
  it("antes de empezar solo recuerda la elección, y no suena", () => {
    const creados: ReturnType<typeof contextoFalso>[] = [];
    const r = crearReproductor(() => (creados.push(contextoFalso()), creados[creados.length - 1] as unknown as ContextoDeAudio));
    r.cambiar("jazz");
    expect(creados).toHaveLength(0);
    expect(r.cancionActual()).toBe("jazz");
    r.iniciar();
    expect(creados).toHaveLength(1);
    expect(creados[0].filtros[0].frequency.value).toBe(cancionPorId("jazz").brillo);
  });

  it("al cambiar sonando, corta la anterior y empieza la nueva sin mezclarse", () => {
    vi.useFakeTimers();
    const creados: ReturnType<typeof contextoFalso>[] = [];
    const r = crearReproductor(() => (creados.push(contextoFalso()), creados[creados.length - 1] as unknown as ContextoDeAudio));
    r.iniciar();
    r.cambiar("espacial");
    expect(creados).toHaveLength(2);
    expect(creados[0].cerrado).toBe(true);
    expect(creados[1].osciladores).toBeGreaterThan(0);
    expect(r.estaActivo()).toBe(true);
    expect(r.cancionActual()).toBe("espacial");
    r.detener();
    vi.useRealTimers();
  });

  it("si estaba silenciada, sigue silenciada con la canción nueva", () => {
    vi.useFakeTimers();
    const creados: ReturnType<typeof contextoFalso>[] = [];
    const r = crearReproductor(() => (creados.push(contextoFalso()), creados[creados.length - 1] as unknown as ContextoDeAudio));
    r.silenciar(true);
    r.iniciar();
    r.cambiar("alegre");
    expect(r.estaSilenciado()).toBe(true);
    r.detener();
    vi.useRealTimers();
  });
});

describe("el selector de canciones", () => {
  const opciones = CANCIONES.map(({ id, nombre, descripcion }) => ({ id, nombre, descripcion }));

  it("muestra el botón para elegir además del de silenciar", () => {
    const h = renderToString(<BotonMusica silenciada={false} alAlternar={() => {}} canciones={opciones} actual="lofi" alElegir={() => {}} />);
    expect(h).toContain("Silenciar la música");
    expect(h).toContain("Elegir la canción");
    expect(h).toContain("Canciones");
  });

  it("sin lista de canciones, queda solo el botón de silenciar", () => {
    const h = renderToString(<BotonMusica silenciada={false} alAlternar={() => {}} />);
    expect(h).not.toContain("Elegir la canción");
  });
});
