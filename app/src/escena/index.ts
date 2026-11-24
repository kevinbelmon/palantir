// Interfaz pública de escena: la cámara y el mundo en 3D.
export {
  arrastrar3d,
  camara3dEnSala,
  camara3dEnZona,
  camara3dInicial,
  FOV_VERTICAL,
  INCLINACION,
  interpolar3d,
  limitesDistancia,
  pantallaAPlano,
  posicionDeCamara,
  proyectar,
  zoom3d,
} from "./camara3d";
export type { Camara3D, Punto3D, VistaPantalla } from "./camara3d";
export { soportaWebGL } from "./webgl";
export { crearPostproceso } from "./postproceso";
export type { Postproceso } from "./postproceso";
export { construirMundo } from "./mundo3d";
export type { Mundo3D } from "./mundo3d";
export type { ModoDeVista } from "./mundo3d";
export { ALTURA_OJOS, ALTURA_TECHO, candidatos, entradaDeSala, ESCALA_CASA, OJOS_EN_CASA, girarJugador, JUGADOR_INICIAL, moverJugador, objetivoDeInteraccion, obstaculos, RADIO_JUGADOR, salaDe, tocaRect } from "./persona";
export type { Jugador } from "./persona";
