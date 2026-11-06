/** Frecuencia en Hz de una nota MIDI (el la central, la 69, es 440 Hz). */
export function frecuencia(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export type NotaProgramada = { midi: number; tiempo: number; duracion: number };

/** Un golpe de la batería: dónde cae dentro del compás (en segundos) y cuánto pesa (de 0 a 1). */
export type GolpeDeRitmo = { instrumento: "bombo" | "caja" | "hihat"; tiempo: number; fuerza: number };

type Frase = readonly { midi: number; negras: number; largo: number }[];

export type Cancion = {
  id: string;
  nombre: string;
  descripcion: string;
  bpm: number;
  /** Un acorde por compás (notas MIDI), que se repite al terminar. */
  progresion: readonly (readonly number[])[];
  /** Cómo toca el bajo: una nota larga, la raíz dos veces, caminando por el acorde, o nada. */
  bajo: "pedal" | "raiz" | "caminando" | "ninguno";
  /** Qué toca la batería. */
  ritmo: "lofi" | "jazz" | "alegre" | "ninguno";
  /** Cómo suena el acompañamiento sobre el colchón de acordes. */
  textura: "golpes" | "arpegio" | "ninguna";
  /** Una frase por acorde. Empieza a sonar desde la segunda vuelta de la progresión. */
  melodia: readonly Frase[];
  /** Cuánto tarda la melodía en llegar a su volumen (más largo = más flotante). */
  ataqueMelodia: number;
  /** Frecuencia desde la que se apagan los agudos (más baja = más sordo y cálido). */
  brillo: number;
};

/** Lo-fi con ritmo: re menor 9 → sol 7 → do mayor 9 → la menor 9, con bombo, caja y hi-hat con swing. */
const LOFI: Cancion = {
  id: "lofi",
  nombre: "Lo-fi con ritmo",
  descripcion: "Acordes suaves, bajo redondo y una batería tranquila. Para trabajar.",
  bpm: 78,
  progresion: [
    [50, 53, 57, 60, 64],
    [43, 47, 50, 53, 57],
    [48, 52, 55, 59, 62],
    [45, 48, 52, 55, 59],
  ],
  bajo: "raiz",
  ritmo: "lofi",
  textura: "golpes",
  melodia: [
    [{ midi: 72, negras: 0.5, largo: 1 }, { midi: 69, negras: 1.5, largo: 0.5 }, { midi: 67, negras: 2, largo: 1.6 }],
    [{ midi: 71, negras: 0.5, largo: 1 }, { midi: 67, negras: 1.5, largo: 0.5 }, { midi: 65, negras: 2, largo: 1.6 }],
    [{ midi: 67, negras: 0.5, largo: 1 }, { midi: 72, negras: 1.5, largo: 0.5 }, { midi: 71, negras: 2.5, largo: 1.2 }],
    [{ midi: 69, negras: 0.5, largo: 0.5 }, { midi: 67, negras: 1, largo: 0.5 }, { midi: 64, negras: 2, largo: 2 }],
  ],
  ataqueMelodia: 0.04,
  brillo: 1500,
};

/** Lluvia suave: sin batería, solo acordes y un arpegio lento. */
const LLUVIA: Cancion = {
  id: "lluvia",
  nombre: "Lluvia suave",
  descripcion: "Acordes y un arpegio lento, sin batería. La más calma.",
  bpm: 72,
  progresion: [
    [48, 52, 55, 59],
    [45, 48, 52, 55],
    [50, 53, 57, 60],
    [43, 47, 50, 53],
  ],
  bajo: "pedal",
  ritmo: "ninguno",
  textura: "arpegio",
  melodia: [],
  ataqueMelodia: 0.04,
  brillo: 1400,
};

/** Ambiente espacial: sonidos largos que flotan, sin ritmo. */
const ESPACIAL: Cancion = {
  id: "espacial",
  nombre: "Ambiente espacial",
  descripcion: "Sonidos largos que flotan, sin ritmo. Misteriosa y relajante.",
  bpm: 60,
  progresion: [
    [41, 48, 52, 55, 60],
    [45, 52, 55, 60, 64],
    [50, 57, 60, 64, 65],
    [48, 55, 59, 62, 64],
  ],
  bajo: "pedal",
  ritmo: "ninguno",
  textura: "ninguna",
  melodia: [[{ midi: 72, negras: 0.5, largo: 3.2 }], [{ midi: 69, negras: 1, largo: 2.8 }], [{ midi: 74, negras: 0.5, largo: 3.2 }], [{ midi: 71, negras: 1, largo: 2.8 }]],
  ataqueMelodia: 0.9,
  brillo: 2300,
};

/** Jazz de cafetería: bajo caminando, escobillas suaves y una melodía que se mueve de a poco. */
const JAZZ: Cancion = {
  id: "jazz",
  nombre: "Jazz de cafetería",
  descripcion: "Bajo que camina, escobillas suaves y acordes de piano. Cálida y elegante.",
  bpm: 86,
  progresion: [
    [50, 53, 57, 60, 64],
    [43, 47, 50, 53, 57],
    [48, 52, 55, 59, 62],
    [45, 49, 52, 55, 59],
  ],
  bajo: "caminando",
  ritmo: "jazz",
  textura: "golpes",
  melodia: [
    [{ midi: 72, negras: 0.5, largo: 0.75 }, { midi: 69, negras: 1.25, largo: 0.5 }, { midi: 65, negras: 2, largo: 0.5 }, { midi: 69, negras: 2.75, largo: 1 }],
    [{ midi: 71, negras: 0.5, largo: 0.75 }, { midi: 67, negras: 1.25, largo: 0.5 }, { midi: 65, negras: 2, largo: 0.5 }, { midi: 62, negras: 2.75, largo: 1 }],
    [{ midi: 67, negras: 0.5, largo: 1 }, { midi: 72, negras: 1.75, largo: 0.5 }, { midi: 71, negras: 2.5, largo: 0.5 }, { midi: 67, negras: 3, largo: 0.9 }],
    [{ midi: 73, negras: 0.5, largo: 0.75 }, { midi: 69, negras: 1.25, largo: 0.5 }, { midi: 67, negras: 2, largo: 0.5 }, { midi: 64, negras: 2.75, largo: 1 }],
  ],
  ataqueMelodia: 0.03,
  brillo: 1800,
};

/** Atardecer alegre: tono mayor, un poco más movida y con una melodía simpática. */
const ALEGRE: Cancion = {
  id: "alegre",
  nombre: "Atardecer alegre",
  descripcion: "Tono mayor, ritmo suave y una melodía de buen humor.",
  bpm: 92,
  progresion: [
    [48, 52, 55, 62, 64],
    [43, 47, 50, 55, 59],
    [45, 48, 52, 57, 60],
    [41, 48, 53, 57, 60],
  ],
  bajo: "raiz",
  ritmo: "alegre",
  textura: "arpegio",
  melodia: [
    [{ midi: 72, negras: 0, largo: 0.5 }, { midi: 74, negras: 0.5, largo: 0.5 }, { midi: 76, negras: 1, largo: 1 }, { midi: 72, negras: 2.5, largo: 1 }],
    [{ midi: 74, negras: 0, largo: 0.5 }, { midi: 71, negras: 0.5, largo: 0.5 }, { midi: 67, negras: 1, largo: 1 }, { midi: 71, negras: 2.5, largo: 1 }],
    [{ midi: 72, negras: 0, largo: 0.5 }, { midi: 69, negras: 0.5, largo: 0.5 }, { midi: 72, negras: 1, largo: 1 }, { midi: 76, negras: 2.5, largo: 1 }],
    [{ midi: 72, negras: 0, largo: 0.5 }, { midi: 69, negras: 0.5, largo: 0.5 }, { midi: 65, negras: 1, largo: 1 }, { midi: 69, negras: 2.5, largo: 1 }],
  ],
  ataqueMelodia: 0.03,
  brillo: 2000,
};

/** Las canciones para elegir. La primera es la que suena al empezar. */
export const CANCIONES: readonly Cancion[] = [LOFI, LLUVIA, ESPACIAL, JAZZ, ALEGRE];

export function cancionPorId(id: string | null | undefined): Cancion {
  return CANCIONES.find((c) => c.id === id) ?? CANCIONES[0];
}

// ---- cada canción se pide por compás; si no se dice cuál, es la primera ----

export const negra = (c: Cancion = LOFI) => 60 / c.bpm;
/** Un compás son cuatro negras. */
export const duracionDelCompas = (c: Cancion = LOFI) => negra(c) * 4;

/** Para quien solo quiere la primera canción: su tempo y la duración de su compás. */
export const BPM = LOFI.bpm;
export const DURACION_COMPAS = duracionDelCompas(LOFI);
export const PROGRESION = LOFI.progresion;
export const NEGRA = negra(LOFI);

const dentro = (n: number, largo: number) => ((n % largo) + largo) % largo;

/** El acorde de cada compás; al terminar la progresión vuelve a empezar. */
export function acordeDelCompas(compas: number, c: Cancion = LOFI): readonly number[] {
  return c.progresion[dentro(compas, c.progresion.length)];
}

/** El bajo, según cómo lo toque la canción. */
export function bajoDelCompas(compas: number, c: Cancion = LOFI): NotaProgramada[] {
  const acorde = acordeDelCompas(compas, c);
  const raiz = acorde[0] - 12;
  const n = negra(c);
  switch (c.bajo) {
    case "ninguno":
      return [];
    case "pedal":
      return [{ midi: raiz, tiempo: 0, duracion: n * 4 }];
    case "raiz":
      return [
        { midi: raiz, tiempo: 0, duracion: n * 1.6 },
        { midi: raiz, tiempo: n * 2.5, duracion: n * 1.2 },
      ];
    case "caminando":
      return [raiz, acorde[1] - 12, acorde[2] - 12, acorde[1] - 12].map((midi, i) => ({ midi, tiempo: i * n, duracion: n * 0.95 }));
  }
}

/** Golpes cortos del acorde (como un piano eléctrico) en el primer tiempo y a contratiempo. */
export function golpesDeAcorde(compas: number, c: Cancion = LOFI): NotaProgramada[] {
  const acorde = acordeDelCompas(compas, c).slice(1);
  const n = negra(c);
  return [0, 1.75, 2.5].flatMap((negras) => acorde.map((midi) => ({ midi, tiempo: negras * n, duracion: n * (negras === 0 ? 1.5 : 0.8) })));
}

// Dos dibujos de arpegio que se alternan, para que no suene siempre igual.
const DIBUJOS: readonly (readonly number[])[] = [
  [0, 2, 1, 3, 2, 3, 1, 2],
  [3, 1, 2, 0, 1, 2, 0, 1],
];

/** Ocho notas suaves por compás, una octava arriba del acorde, una cada media negra. */
export function arpegioDelCompas(compas: number, c: Cancion = LOFI): NotaProgramada[] {
  const acorde = acordeDelCompas(compas, c);
  const dibujo = DIBUJOS[dentro(compas, DIBUJOS.length)];
  return dibujo.map((indice, i) => ({ midi: acorde[indice % acorde.length] + 12, tiempo: i * (negra(c) / 2), duracion: 1.1 }));
}

/** El acompañamiento sobre los acordes: golpes, arpegio o nada, según la canción. */
export function texturaDelCompas(compas: number, c: Cancion = LOFI): NotaProgramada[] {
  if (c.textura === "golpes") return golpesDeAcorde(compas, c);
  if (c.textura === "arpegio") return arpegioDelCompas(compas, c);
  return [];
}

/** La melodía del compás. En la primera vuelta de la progresión no suena y entra desde la segunda. */
export function melodiaDelCompas(compas: number, c: Cancion = LOFI): NotaProgramada[] {
  if (compas < c.progresion.length || c.melodia.length === 0) return [];
  const n = negra(c);
  return c.melodia[dentro(compas, c.melodia.length)].map((x) => ({ midi: x.midi, tiempo: x.negras * n, duracion: x.largo * n }));
}

/** La batería de un compás, según la canción. El hi-hat «con swing» llega un poquito tarde en los contratiempos. */
export function ritmoDelCompas(c: Cancion = LOFI): GolpeDeRitmo[] {
  const n = negra(c);
  const golpes: GolpeDeRitmo[] = [];
  if (c.ritmo === "lofi") {
    golpes.push({ instrumento: "bombo", tiempo: 0, fuerza: 1 }, { instrumento: "bombo", tiempo: n * 2.5, fuerza: 0.8 }, { instrumento: "caja", tiempo: n, fuerza: 0.9 }, { instrumento: "caja", tiempo: n * 3, fuerza: 0.9 });
    for (let i = 0; i < 8; i++) {
      const contratiempo = i % 2 === 1;
      golpes.push({ instrumento: "hihat", tiempo: n * (i * 0.5 + (contratiempo ? 0.08 : 0)), fuerza: contratiempo ? 0.45 : 0.8 });
    }
  } else if (c.ritmo === "jazz") {
    // el ritmo del platillo de jazz: negra, negra, y la tercera parte de la negra
    for (const [negras, fuerza] of [[0, 0.8], [1, 0.9], [1.67, 0.5], [2, 0.8], [3, 0.9], [3.67, 0.5]] as const) golpes.push({ instrumento: "hihat", tiempo: n * negras, fuerza });
    golpes.push({ instrumento: "bombo", tiempo: 0, fuerza: 0.35 });
  } else if (c.ritmo === "alegre") {
    golpes.push({ instrumento: "bombo", tiempo: 0, fuerza: 1 }, { instrumento: "bombo", tiempo: n * 2, fuerza: 0.85 }, { instrumento: "caja", tiempo: n, fuerza: 0.7 }, { instrumento: "caja", tiempo: n * 3, fuerza: 0.7 });
    for (let i = 0; i < 8; i++) golpes.push({ instrumento: "hihat", tiempo: n * i * 0.5, fuerza: i % 2 === 0 ? 0.7 : 0.45 });
  }
  return golpes.sort((a, b) => a.tiempo - b.tiempo);
}
