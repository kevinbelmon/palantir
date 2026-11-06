import type { CSSProperties } from "react";

/** Ancho que ocupa la columna de la derecha: el mapa se corre para no quedar tapado. */
export const ANCHO_PANEL = 408;

/** El lugar de la derecha donde se muestra todo lo que hay que leer o completar (agente, documento, archivos…). */
export const estiloColumna: CSSProperties = {
  position: "absolute",
  right: 14,
  top: 76,
  bottom: 124,
  width: ANCHO_PANEL - 28,
  display: "flex",
  flexDirection: "column",
  zIndex: 7,
};
