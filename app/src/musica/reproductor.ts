import { acordeDelCompas, arpegioDelCompas, DURACION_COMPAS, frecuencia } from "./partitura";

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
 * Música chill generada con el sonido del navegador: acordes suaves y un arpegio lento.
 * No suena nada hasta `iniciar()`, que hay que llamar desde un clic de la persona
 * (los navegadores no dejan sonar antes).
 */
export function crearReproductor(fabrica: () => ContextoDeAudio = () => new AudioContext() as unknown as ContextoDeAudio) {
  let ctx: ContextoDeAudio | null = null;
  let filtro: FiltroDeAudio | null = null;
  let maestra: GananciaDeAudio | null = null;
  let reloj: ReturnType<typeof setInterval> | null = null;
  let compas = 0;
  let proximo = 0;
  let silenciada = false;

  function nota(tipo: string, midi: number, inicio: number, duracion: number, volumen: number, ataque: number) {
    if (!ctx || !filtro) return;
    const osc = ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.value = frecuencia(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, inicio);
    g.gain.linearRampToValueAtTime(volumen, inicio + ataque);
    g.gain.linearRampToValueAtTime(0, inicio + duracion);
    osc.connect(g);
    g.connect(filtro);
    osc.start(inicio);
    osc.stop(inicio + duracion + 0.05);
  }

  function programarCompas(n: number, t0: number) {
    const acorde = acordeDelCompas(n);
    for (const midi of acorde) nota("sine", midi, t0, DURACION_COMPAS + 0.6, 0.05, 1.0);
    nota("sine", acorde[0] - 12, t0, DURACION_COMPAS, 0.09, 0.15);
    for (const a of arpegioDelCompas(n)) nota("triangle", a.midi, t0 + a.tiempo, 1.1, 0.045, 0.02);
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
      filtro = ctx.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.value = 1400;
      filtro.connect(maestra);
      maestra.connect(ctx.destination);
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
      filtro = null;
    },
    estaActivo: () => ctx !== null,
    estaSilenciado: () => silenciada,
  };
}
