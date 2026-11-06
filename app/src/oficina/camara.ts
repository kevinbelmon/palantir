import { MUNDO } from "./mundo";

/** `x` e `y` son el punto del mundo que está en la esquina superior izquierda de la pantalla. */
export type Camara = { x: number; y: number; zoom: number };

/** Cámara que muestra toda la oficina, centrada, en una ventana de cualquier forma. */
export function camaraAjustada(anchoVista: number, altoVista: number): Camara {
  const zoom = Math.min(anchoVista / MUNDO.ancho, altoVista / MUNDO.alto) * 0.96;
  return {
    zoom,
    x: -(anchoVista / zoom - MUNDO.ancho) / 2,
    y: -(altoVista / zoom - MUNDO.alto) / 2,
  };
}
