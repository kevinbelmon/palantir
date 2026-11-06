export type Ctx = CanvasRenderingContext2D;

export const FUENTE = '"Segoe UI Variable Display","Segoe UI",system-ui,sans-serif';

export function rectRedondo(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function rellenar(ctx: Ctx, color: string) {
  ctx.fillStyle = color;
  ctx.fill();
}

export function texto(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  o: { tam: number; color: string; peso?: number; alinear?: CanvasTextAlign; base?: CanvasTextBaseline },
) {
  ctx.font = `${o.peso ?? 600} ${o.tam}px ${FUENTE}`;
  ctx.fillStyle = o.color;
  ctx.textAlign = o.alinear ?? "left";
  ctx.textBaseline = o.base ?? "alphabetic";
  ctx.fillText(s, x, y);
}

/** Caja en perspectiva oblicua: cara de frente, tapa hacia arriba-derecha y lateral derecho. */
export function caja(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  prof: number,
  colores: { frente: string; tapa: string; lado: string },
) {
  const dx = prof * 0.55;
  const dy = prof * 0.8;
  ctx.fillStyle = colores.lado;
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + dx, y - dy);
  ctx.lineTo(x + w + dx, y + h - dy);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colores.tapa;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w + dx, y - dy);
  ctx.lineTo(x + dx, y - dy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colores.frente;
  ctx.fillRect(x, y, w, h);
}

/** Sombra suave bajo un objeto, para que no flote. */
export function sombra(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, alfa = 0.22) {
  ctx.fillStyle = `rgba(20, 22, 50, ${alfa})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
