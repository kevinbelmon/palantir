// Interfaz pública de música: la partitura y el reproductor.
export { acordeDelCompas, arpegioDelCompas, bajoDelCompas, BPM, CANCIONES, cancionPorId, DURACION_COMPAS, duracionDelCompas, frecuencia, golpesDeAcorde, melodiaDelCompas, PROGRESION, ritmoDelCompas, texturaDelCompas } from "./partitura";
export type { Cancion, GolpeDeRitmo, NotaProgramada } from "./partitura";
export { crearReproductor } from "./reproductor";
export type { ContextoDeAudio } from "./reproductor";
