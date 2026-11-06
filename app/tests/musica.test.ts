import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { acordeDelCompas, arpegioDelCompas, BPM, DURACION_COMPAS, frecuencia, PROGRESION } from "../src/musica";
import { crearReproductor, type ContextoDeAudio } from "../src/musica";

describe("la partitura", () => {
  it("convierte notas MIDI en frecuencias (el la central es 440 Hz)", () => {
    expect(frecuencia(69)).toBeCloseTo(440);
    expect(frecuencia(57)).toBeCloseTo(220);
    expect(frecuencia(81)).toBeCloseTo(880);
  });

  it("es lenta: el tempo es tranquilo", () => {
    expect(BPM).toBeLessThanOrEqual(80);
    expect(DURACION_COMPAS).toBeCloseTo((60 / BPM) * 4);
  });

  it("tiene una progresión de al menos cuatro acordes, con varias notas cada uno", () => {
    expect(PROGRESION.length).toBeGreaterThanOrEqual(4);
    for (const acorde of PROGRESION) expect(acorde.length).toBeGreaterThanOrEqual(3);
  });

  it("todas las notas son graves o medias, nada agudo ni chillón", () => {
    for (const acorde of PROGRESION) {
      for (const n of acorde) {
        expect(n).toBeGreaterThanOrEqual(36);
        expect(n).toBeLessThanOrEqual(72);
      }
    }
  });

  it("al terminar la progresión vuelve a empezar", () => {
    expect(acordeDelCompas(0)).toEqual(PROGRESION[0]);
    expect(acordeDelCompas(PROGRESION.length)).toEqual(PROGRESION[0]);
    expect(acordeDelCompas(PROGRESION.length + 2)).toEqual(PROGRESION[2]);
  });

  it("el arpegio de cada compás usa notas del acorde, en orden de tiempo", () => {
    for (let c = 0; c < PROGRESION.length; c++) {
      const acorde = acordeDelCompas(c);
      const notas = arpegioDelCompas(c);
      expect(notas.length).toBeGreaterThanOrEqual(6);
      notas.forEach((n, i) => {
        expect(acorde.some((a) => (n.midi - a) % 12 === 0)).toBe(true);
        if (i > 0) expect(n.tiempo).toBeGreaterThan(notas[i - 1].tiempo);
        expect(n.tiempo).toBeGreaterThanOrEqual(0);
        expect(n.tiempo).toBeLessThan(DURACION_COMPAS);
      });
    }
  });
});

// ── un sonido de mentira, para probar el reproductor sin placa de audio ──
class ParamFalso {
  value = 0;
  fijar = vi.fn();
  setValueAtTime(v: number, t: number) {
    this.value = v;
    this.fijar("set", v, t);
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.fijar("rampa", v, t);
  }
  exponentialRampToValueAtTime(v: number, t: number) {
    this.fijar("exp", v, t);
  }
  setTargetAtTime(v: number, t: number) {
    this.value = v;
    this.fijar("objetivo", v, t);
  }
  cancelScheduledValues() {}
}
class NodoFalso {
  connect() {
    return this;
  }
  disconnect() {}
}
class OsciladorFalso extends NodoFalso {
  type = "sine";
  frequency = new ParamFalso();
  iniciado: number | null = null;
  detenido: number | null = null;
  start(t: number) {
    this.iniciado = t;
  }
  stop(t: number) {
    this.detenido = t;
  }
}
class GananciaFalsa extends NodoFalso {
  gain = new ParamFalso();
}
class FiltroFalso extends NodoFalso {
  type = "lowpass";
  frequency = new ParamFalso();
  Q = new ParamFalso();
}
class ContextoFalso {
  currentTime = 0;
  state = "running";
  destination = new NodoFalso();
  osciladores: OsciladorFalso[] = [];
  ganancias: GananciaFalsa[] = [];
  cerrado = false;
  reanudado = 0;
  createOscillator() {
    const o = new OsciladorFalso();
    this.osciladores.push(o);
    return o;
  }
  createGain() {
    const g = new GananciaFalsa();
    this.ganancias.push(g);
    return g;
  }
  createBiquadFilter() {
    return new FiltroFalso();
  }
  resume() {
    this.reanudado++;
    return Promise.resolve();
  }
  close() {
    this.cerrado = true;
    return Promise.resolve();
  }
}

describe("el reproductor de música", () => {
  let contextos: ContextoFalso[];
  const crear = () =>
    crearReproductor(() => {
      const c = new ContextoFalso();
      contextos.push(c);
      return c as unknown as ContextoDeAudio;
    });

  beforeEach(() => {
    contextos = [];
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("no crea ningún sonido hasta que la persona hace el primer clic", () => {
    crear();
    expect(contextos).toHaveLength(0);
  });

  it("al iniciar crea un solo contexto y empieza a programar notas", () => {
    const r = crear();
    r.iniciar();
    r.iniciar();
    expect(contextos).toHaveLength(1);
    expect(contextos[0].osciladores.length).toBeGreaterThanOrEqual(PROGRESION[0].length);
    expect(r.estaActivo()).toBe(true);
  });

  it("sigue programando compases mientras suena, sin cortarse", () => {
    const r = crear();
    r.iniciar();
    const antes = contextos[0].osciladores.length;
    contextos[0].currentTime = 3;
    vi.advanceTimersByTime(600);
    expect(contextos[0].osciladores.length).toBeGreaterThan(antes);
  });

  it("silenciar baja el volumen a cero y volver a activar lo devuelve", () => {
    const r = crear();
    r.iniciar();
    const maestra = contextos[0].ganancias[0];
    expect(maestra.gain.value).toBeGreaterThan(0);
    r.silenciar(true);
    expect(r.estaSilenciado()).toBe(true);
    expect(maestra.gain.value).toBe(0);
    r.silenciar(false);
    expect(r.estaSilenciado()).toBe(false);
    expect(maestra.gain.value).toBeGreaterThan(0);
  });

  it("si se silencia antes de iniciar, arranca en silencio", () => {
    const r = crear();
    r.silenciar(true);
    r.iniciar();
    expect(contextos[0].ganancias[0].gain.value).toBe(0);
  });

  it("el volumen es bajo, de música de fondo", () => {
    const r = crear();
    r.iniciar();
    expect(contextos[0].ganancias[0].gain.value).toBeLessThanOrEqual(0.3);
  });

  it("si el navegador lo dejó pausado, lo reanuda", () => {
    const r = crear();
    r.iniciar();
    contextos[0].state = "suspended";
    r.iniciar();
    expect(contextos[0].reanudado).toBeGreaterThanOrEqual(1);
  });

  it("detener cierra el sonido y deja de programar", () => {
    const r = crear();
    r.iniciar();
    r.detener();
    expect(contextos[0].cerrado).toBe(true);
    expect(r.estaActivo()).toBe(false);
    const n = contextos[0].osciladores.length;
    contextos[0].currentTime = 30;
    vi.advanceTimersByTime(5000);
    expect(contextos[0].osciladores.length).toBe(n);
  });
});
