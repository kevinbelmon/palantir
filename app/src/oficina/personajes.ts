import type { EstadoAgente } from "../flujo";
import { parpadeo, respiracion } from "./animacion";
import { APARIENCIAS, PALETA } from "./paleta";
import { type Ctx, rectRedondo, rellenar } from "./primitivas";

/** Personaje de bloques, sentado: se ve de la cintura para arriba. `(cx, cy)` es el centro del torso. */
export function dibujarPersonaje(ctx: Ctx, cx: number, cy: number, indice: number, estado: EstadoAgente, t: number) {
  const a = APARIENCIAS[indice % APARIENCIAS.length];
  ctx.save();
  if (estado === "deshabilitado") ctx.globalAlpha = 0.62;
  // respira: el cuerpo sube y baja un poquito, aunque nadie lo toque
  ctx.translate(0, respiracion(t, indice));

  // movimiento de los brazos: teclea si está corriendo, saluda si está habilitado
  const teclea = estado === "corriendo" ? Math.sin(t * 14) * 6 : 0;
  const saluda = estado === "habilitado" ? Math.sin(t * 6) * 0.35 : 0;

  // brazo izquierdo
  ctx.save();
  ctx.translate(cx - 34, cy - 16);
  ctx.rotate(estado === "habilitado" ? -2.4 + saluda : 0);
  rectRedondo(ctx, -7, 0, 14, 52 + teclea, 6);
  rellenar(ctx, a.camisa);
  ctx.beginPath();
  ctx.arc(0, 52 + teclea, 7.5, 0, Math.PI * 2);
  rellenar(ctx, PALETA.piel);
  ctx.restore();

  // brazo derecho
  ctx.save();
  ctx.translate(cx + 34, cy - 16);
  rectRedondo(ctx, -7, 0, 14, 52 - teclea, 6);
  rellenar(ctx, a.camisa);
  ctx.beginPath();
  ctx.arc(0, 52 - teclea, 7.5, 0, Math.PI * 2);
  rellenar(ctx, PALETA.piel);
  ctx.restore();

  // torso
  rectRedondo(ctx, cx - 28, cy - 24, 56, 62, 9);
  rellenar(ctx, a.camisa);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(cx - 28, cy - 24, 56, 8);

  // cabeza
  rectRedondo(ctx, cx - 25, cy - 80, 50, 50, 11);
  rellenar(ctx, PALETA.piel);
  // pelo, con el taco de arriba de la cabeza
  rectRedondo(ctx, cx - 27, cy - 88, 54, 24, 9);
  rellenar(ctx, a.pelo);
  rectRedondo(ctx, cx - 9, cy - 96, 18, 10, 3);
  rellenar(ctx, a.pelo);
  // cara
  ctx.fillStyle = "#1d2133";
  if (parpadeo(t, indice)) {
    ctx.fillRect(cx - 13, cy - 54, 7, 2);
    ctx.fillRect(cx + 6, cy - 54, 7, 2);
  } else {
    ctx.fillRect(cx - 13, cy - 58, 7, 9);
    ctx.fillRect(cx + 6, cy - 58, 7, 9);
  }
  ctx.strokeStyle = "#7a4a3a";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy - 47, 9, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  ctx.restore();
}
