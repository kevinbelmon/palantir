// Interfaz pública de música: la partitura y el reproductor.
export { acordeDelCompas, bajoDelCompas, BPM, DURACION_COMPAS, frecuencia, golpesDeAcorde, melodiaDelCompas, PROGRESION, ritmoDelCompas } from "./partitura";
export type { GolpeDeRitmo, NotaProgramada } from "./partitura";
export { crearReproductor } from "./reproductor";
export type { ContextoDeAudio } from "./reproductor";
