// Interfaz pública de oficina: el mapa, la cámara y el dibujo.
export { CARTEL_CENTRAL, LOBBY, MUNDO, PAPELERIA, puertaDeSala, rectBrief, rectDocumento, SALAS } from "./mundo";
export { estadoDeSegmento, longitudDeSegmento, puntoEnRuta, RUTA } from "./ruta";
export type { EstadoTramo, Punto, Tramo } from "./ruta";
export { parpadeo, respiracion, tiempoVisible } from "./animacion";
export { ladrillosEn, tacosEn } from "./bloques";
export { posicionEtiqueta } from "./etiquetas";
export { camaraEnSala, interpolarCamara } from "./enfoque";
export { APARIENCIAS, COLORES_ESTADO } from "./paleta";
export type { Rect, Sala, TipoSala } from "./mundo";
export { elementoEn } from "./interaccion";
export type { Elemento } from "./interaccion";
export { arrastrar, camaraAjustada, factorRueda, limitesZoom, mundoAPantalla, pantallaAMundo, zoomEn } from "./camara";
export type { Camara, Vista } from "./camara";
export { dibujarOficina } from "./dibujo";
export type { VistaDibujo } from "./dibujo";
