import { limitesZoom, type Camara, type Vista } from "./camara";
import type { Sala } from "./mundo";

/**
 * La cámara que muestra una sala entera, centrada en la zona visible (entre la barra de arriba y el
 * dock de abajo), con un poco de aire alrededor.
 */
export function camaraEnSala(sala: Sala, vista: Vista, margenSuperior = 0, margenInferior = 0): Camara {
  const alto = vista.alto - margenSuperior - margenInferior;
  const ideal = Math.min(vista.ancho / (sala.area.w * 1.35), alto / (sala.area.h * 1.35));
  const { min, max } = limitesZoom(vista.ancho, vista.alto);
  const zoom = Math.min(Math.max(ideal, min), max);
  const cx = sala.area.x + sala.area.w / 2;
  const cy = sala.area.y + sala.area.h / 2;
  return { zoom, x: cx - vista.ancho / 2 / zoom, y: cy - (margenSuperior + alto / 2) / zoom };
}

/** Un punto del viaje entre dos cámaras (`k` de 0 a 1), suave al salir y al llegar. */
export function interpolarCamara(a: Camara, b: Camara, k: number): Camara {
  const t = Math.min(1, Math.max(0, k));
  const e = t * t * (3 - 2 * t);
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, zoom: a.zoom + (b.zoom - a.zoom) * e };
}
