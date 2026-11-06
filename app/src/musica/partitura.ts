/** Tempo tranquilo, de lo-fi para tener de fondo. */
export const BPM = 78;
export const NEGRA = 60 / BPM;
/** Un compás son cuatro negras. */
export const DURACION_COMPAS = NEGRA * 4;

/** Frecuencia en Hz de una nota MIDI (el la central, la 69, es 440 Hz). */
export function frecuencia(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Acordes con novena y séptima, el sonido "lo-fi" de siempre: re menor 9 → sol 7 → do mayor 9 → la menor 9.
 * Notas MIDI, graves y medias.
 */
export const PROGRESION: readonly (readonly number[])[] = [
  [50, 53, 57, 60, 64],
  [43, 47, 50, 53, 57],
  [48, 52, 55, 59, 62],
  [45, 48, 52, 55, 59],
];

/** El acorde de cada compás; al terminar la progresión vuelve a empezar. */
export function acordeDelCompas(compas: number): readonly number[] {
  return PROGRESION[((compas % PROGRESION.length) + PROGRESION.length) % PROGRESION.length];
}

export type NotaProgramada = { midi: number; tiempo: number; duracion: number };

/** Un golpe de la batería: dónde cae dentro del compás (en segundos) y cuánto pesa (de 0 a 1). */
export type GolpeDeRitmo = { instrumento: "bombo" | "caja" | "hihat"; tiempo: number; fuerza: number };

const dentro = (n: number, largo: number) => ((n % largo) + largo) % largo;
const enSegundos = (negras: number) => negras * NEGRA;

/** El bajo: la nota más grave del acorde, una octava abajo, en el primer tiempo y un poco corrido (a contratiempo). */
export function bajoDelCompas(compas: number): NotaProgramada[] {
  const raiz = acordeDelCompas(compas)[0] - 12;
  return [
    { midi: raiz, tiempo: 0, duracion: enSegundos(1.6) },
    { midi: raiz, tiempo: enSegundos(2.5), duracion: enSegundos(1.2) },
  ];
}

/** Golpes cortos del acorde (como un piano eléctrico) en el primer tiempo y a contratiempo; cada uno suena con las notas altas del acorde. */
export function golpesDeAcorde(compas: number): NotaProgramada[] {
  const acorde = acordeDelCompas(compas).slice(1);
  return [0, 1.75, 2.5].flatMap((negras) => acorde.map((midi) => ({ midi, tiempo: enSegundos(negras), duracion: enSegundos(negras === 0 ? 1.5 : 0.8) })));
}

// Una frase corta y simple por acorde (notas del acorde o de su escala), con silencios entre nota y nota.
const FRASES: readonly (readonly { midi: number; negras: number; largo: number }[])[] = [
  [{ midi: 72, negras: 0.5, largo: 1 }, { midi: 69, negras: 1.5, largo: 0.5 }, { midi: 67, negras: 2, largo: 1.6 }],
  [{ midi: 71, negras: 0.5, largo: 1 }, { midi: 67, negras: 1.5, largo: 0.5 }, { midi: 65, negras: 2, largo: 1.6 }],
  [{ midi: 67, negras: 0.5, largo: 1 }, { midi: 72, negras: 1.5, largo: 0.5 }, { midi: 71, negras: 2.5, largo: 1.2 }],
  [{ midi: 69, negras: 0.5, largo: 0.5 }, { midi: 67, negras: 1, largo: 0.5 }, { midi: 64, negras: 2, largo: 2 }],
];

/** La melodía del compás. En la primera vuelta de la progresión no suena (solo acordes, bajo y ritmo) y entra desde la segunda. */
export function melodiaDelCompas(compas: number): NotaProgramada[] {
  if (compas < PROGRESION.length) return [];
  const frase = FRASES[dentro(compas, FRASES.length)];
  return frase.map((n) => ({ midi: n.midi, tiempo: enSegundos(n.negras), duracion: enSegundos(n.largo) }));
}

/**
 * La batería de un compás: bombo en el primer tiempo y a contratiempo, caja en el segundo y el cuarto,
 * y hi-hat cada media negra con "swing" (los contratiempos llegan un poquito tarde, como tocado a mano).
 */
export function ritmoDelCompas(): GolpeDeRitmo[] {
  const golpes: GolpeDeRitmo[] = [
    { instrumento: "bombo", tiempo: 0, fuerza: 1 },
    { instrumento: "bombo", tiempo: enSegundos(2.5), fuerza: 0.8 },
    { instrumento: "caja", tiempo: enSegundos(1), fuerza: 0.9 },
    { instrumento: "caja", tiempo: enSegundos(3), fuerza: 0.9 },
  ];
  for (let i = 0; i < 8; i++) {
    const contratiempo = i % 2 === 1;
    golpes.push({ instrumento: "hihat", tiempo: enSegundos(i * 0.5 + (contratiempo ? 0.08 : 0)), fuerza: contratiempo ? 0.45 : 0.8 });
  }
  return golpes.sort((a, b) => a.tiempo - b.tiempo);
}
