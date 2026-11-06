// Interfaz pública de oficina: el mapa, la cámara y el dibujo.
export { CARTEL_CENTRAL, LOBBY, MUNDO, PAPELERIA, SALAS } from "./mundo";
export type { Rect, Sala, TipoSala } from "./mundo";
export { arrastrar, camaraAjustada, factorRueda, limitesZoom, mundoAPantalla, pantallaAMundo, zoomEn } from "./camara";
export type { Camara, Vista } from "./camara";
export { dibujarOficina } from "./dibujo";
export type { VistaDibujo } from "./dibujo";
