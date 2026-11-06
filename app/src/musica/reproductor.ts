import { acordeDelCompas, bajoDelCompas, DURACION_COMPAS, frecuencia, golpesDeAcorde, melodiaDelCompas, ritmoDelCompas } from "./partitura";

// Lo mínimo que usamos del sonido del navegador. `AudioContext` lo cumple tal cual;
// en los tests se reemplaza por uno de mentira, así no hace falta placa de audio.
type ParametroDeAudio = {
  value: number;
  setValueAtTime(valor: number, tiempo: number): unknown;
  linearRampToValueAtTime(valor: number, tiempo: number): unknown;
  setTargetAtTime(valor: number, tiempo: number, constante: number): unknown;
};
type NodoDeAudio = { connect(destino: unknown): unknown };
type OsciladorDeAudio = NodoDeAudio & { type: string; frequency: ParametroDeAudio; start(t: number): void; stop(t: number): void };
type GananciaDeAudio = NodoDeAudio & { gain: ParametroDeAudio };
type FiltroDeAudio = NodoDeAudio & { type: string; frequency: ParametroDeAudio };

export type ContextoDeAudio = {
  currentTime: number;
  state: string;
  destination: unknown;
  createOscillator(): OsciladorDeAudio;
  createGain(): GananciaDeAudio;
  createBiquadFilter(): FiltroDeAudio;
  resume(): Promise<void>;
  close(): Promise<void>;
};

const VOLUMEN = 0.16; // música de fondo: bajita
const ANTICIPO = 2.5; // cuántos segundos por delante se dejan programados
const CADA_MS = 500;

/**
 * Lo-fi con ritmo generado con el sonido del navegador: acordes suaves, bajo, una melodía simple y una batería
 * tranquila (bombo, caja y hi-hat). No suena nada hasta `iniciar()`, que hay que llamar desde un clic de la
 * persona (los navegadores no dejan sonar antes).
 */
export function crearReproductor(fabrica: () => ContextoDeAudio = () => new AudioContext() as unknown as ContextoDeAudio) {
  let ctx: ContextoDeAudio | null = null;
  let tonos: FiltroDeAudio | null = null; // acordes, bajo y melodía: suaves, con las agudas apagadas
  let percusion: FiltroDeAudio | null = null; // la batería pasa más brillante
  let maestra: GananciaDeAudio | null = null;
  let reloj: ReturnType<typeof setInterval> | null = null;
  let compas = 0;
  let proximo = 0;
  let silenciada = false;

  /** Una nota con forma de «subir y bajar»: `ataque` es lo que tarda en llegar a su volumen. */
  function nota(destino: FiltroDeAudio | null, tipo: string, midi: number, inicio: number, duracion: number, volumen: number, ataque: number) {
    if (!ctx || !destino) return;
    const osc = ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.value = frecuencia(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, inicio);
    g.gain.linearRampToValueAtTime(volumen, inicio + ataque);
    g.gain.linearRampToValueAtTime(0, inicio + duracion);
    osc.connect(g);
    g.connect(destino);
    osc.start(inicio);
    osc.stop(inicio + duracion + 0.05);
  }

  /** Un golpe de batería hecho con un tono que cae rápido de agudo a grave. */
  function golpe(tipo: string, desde: number, hasta: number, inicio: number, duracion: number, volumen: number) {
    if (!ctx || !percusion) return;
    const osc = ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.setValueAtTime(desde, inicio);
    osc.frequency.linearRampToValueAtTime(hasta, inicio + duracion * 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, inicio);
    g.gain.linearRampToValueAtTime(volumen, inicio + 0.004);
    g.gain.linearRampToValueAtTime(0, inicio + duracion);
    osc.connect(g);
    g.connect(percusion);
    osc.start(inicio);
    osc.stop(inicio + duracion + 0.03);
  }

  function programarCompas(n: number, t0: number) {
    const acorde = acordeDelCompas(n);
    // un colchón suave de acordes que se queda sonando todo el compás
    for (const midi of acorde) nota(tonos, "sine", midi, t0, DURACION_COMPAS + 0.5, 0.032, 0.9);
    for (const a of golpesDeAcorde(n)) nota(tonos, "triangle", a.midi, t0 + a.tiempo, a.duracion, 0.02, 0.015);
    for (const b of bajoDelCompas(n)) nota(tonos, "sine", b.midi, t0 + b.tiempo, b.duracion, 0.11, 0.02);
    for (const m of melodiaDelCompas(n)) nota(tonos, "triangle", m.midi, t0 + m.tiempo, m.duracion, 0.05, 0.04);
    for (const r of ritmoDelCompas()) {
      const t = t0 + r.tiempo;
      if (r.instrumento === "bombo") golpe("sine", 135, 45, t, 0.26, 0.4 * r.fuerza);
      else if (r.instrumento === "caja") {
        golpe("triangle", 210, 150, t, 0.16, 0.13 * r.fuerza);
        golpe("square", 340, 260, t, 0.09, 0.035 * r.fuerza);
      } else golpe("square", 7200, 7000, t, 0.035, 0.012 * r.fuerza);
    }
  }

  function planificar() {
    if (!ctx) return;
    while (proximo < ctx.currentTime + ANTICIPO) {
      programarCompas(compas, proximo);
      proximo += DURACION_COMPAS;
      compas++;
    }
  }

  return {
    /** Arranca la música. Se puede llamar muchas veces: solo crea el sonido la primera. */
    iniciar() {
      if (ctx) {
        if (ctx.state === "suspended") void ctx.resume();
        return;
      }
      ctx = fabrica();
      maestra = ctx.createGain();
      maestra.gain.value = silenciada ? 0 : VOLUMEN;
      maestra.connect(ctx.destination);
      tonos = ctx.createBiquadFilter();
      tonos.type = "lowpass";
      tonos.frequency.value = 1500;
      tonos.connect(maestra);
      percusion = ctx.createBiquadFilter();
      percusion.type = "lowpass";
      percusion.frequency.value = 8000;
      percusion.connect(maestra);
      if (ctx.state === "suspended") void ctx.resume();
      compas = 0;
      proximo = ctx.currentTime + 0.1;
      planificar();
      reloj = setInterval(planificar, CADA_MS);
    },
    /** Silencia o vuelve a activar, con un fundido corto para que no haga "clic". */
    silenciar(valor: boolean) {
      silenciada = valor;
      if (ctx && maestra) maestra.gain.setTargetAtTime(valor ? 0 : VOLUMEN, ctx.currentTime, 0.15);
    },
    detener() {
      if (reloj) clearInterval(reloj);
      reloj = null;
      void ctx?.close();
      ctx = null;
      maestra = null;
      tonos = null;
      percusion = null;
    },
    estaActivo: () => ctx !== null,
    estaSilenciado: () => silenciada,
  };
}
