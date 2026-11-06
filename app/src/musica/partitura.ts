/** Tempo lento y tranquilo: música para tener de fondo. */
export const BPM = 72;
const NEGRA = 60 / BPM;
/** Un compás son cuatro negras. */
export const DURACION_COMPAS = NEGRA * 4;

/** Frecuencia en Hz de una nota MIDI (el la central, la 69, es 440 Hz). */
export function frecuencia(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Progresión suave, con acordes de séptima (el sonido "lo-fi" de siempre):
 * do mayor 7 → la menor 7 → re menor 7 → sol 7. Notas MIDI, graves y medias.
 */
export const PROGRESION: readonly (readonly number[])[] = [
  [48, 52, 55, 59],
  [45, 48, 52, 55],
  [50, 53, 57, 60],
  [43, 47, 50, 53],
];

/** El acorde de cada compás; al terminar la progresión vuelve a empezar. */
export function acordeDelCompas(compas: number): readonly number[] {
  return PROGRESION[((compas % PROGRESION.length) + PROGRESION.length) % PROGRESION.length];
}

export type NotaProgramada = { midi: number; tiempo: number };

// Dos dibujos de arpegio que se alternan, para que no suene siempre igual.
const DIBUJOS: readonly (readonly number[])[] = [
  [0, 2, 1, 3, 2, 3, 1, 2],
  [3, 1, 2, 0, 1, 2, 0, 1],
];

/** Ocho notas suaves por compás, una octava arriba del acorde, una cada media negra. */
export function arpegioDelCompas(compas: number): NotaProgramada[] {
  const acorde = acordeDelCompas(compas);
  const dibujo = DIBUJOS[((compas % DIBUJOS.length) + DIBUJOS.length) % DIBUJOS.length];
  return dibujo.map((indice, i) => ({ midi: acorde[indice % acorde.length] + 12, tiempo: i * (NEGRA / 2) }));
}
