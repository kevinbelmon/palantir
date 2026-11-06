// Interfaz pública de música: la partitura y el reproductor.
export { acordeDelCompas, arpegioDelCompas, BPM, DURACION_COMPAS, frecuencia, PROGRESION } from "./partitura";
export type { NotaProgramada } from "./partitura";
export { crearReproductor } from "./reproductor";
export type { ContextoDeAudio } from "./reproductor";
