import type { ObjetoSala } from "./decoracion";
import { PALETA } from "./paleta";
import { type Ctx, rectRedondo, rellenar, sombra } from "./primitivas";

/** Un objeto propio de cada sala, que cuenta qué hace su agente. */
export function dibujarObjeto(ctx: Ctx, o: ObjetoSala, t: number) {
  const { x, y, w, h } = o;
  const cx = x + w / 2;
  sombra(ctx, cx, y + h + 4, w / 2, 6, 0.2);

  switch (o.tipo) {
    case "papelero": {
      // el papelero de las ideas sueltas
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 50);
      ctx.lineTo(x + w - 4, y + 50);
      ctx.lineTo(x + w - 10, y + h);
      ctx.lineTo(x + 10, y + h);
      ctx.closePath();
      rellenar(ctx, "#8b8fb0");
      ctx.fillStyle = "#6f7396";
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 12 + i * 10, y + 58, 3, h - 66);
      for (const [dx, dy, r] of [[14, 44, 11], [30, 38, 12], [22, 30, 10]] as const) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        rellenar(ctx, PALETA.papel);
      }
      rectRedondo(ctx, x + 6, y - 6 + Math.sin(t * 2) * 2, 22, 22, 3);
      rellenar(ctx, PALETA.resalte);
      break;
    }
    case "libros": {
      rectRedondo(ctx, x, y + 6, w, h - 6, 4);
      rellenar(ctx, PALETA.maderaLado);
      const colores = ["#5b8cff", "#ff6b81", "#3ecf6e", "#f2a33a", "#8e6bff", "#2ec4b6"];
      for (let fila = 0; fila < 3; fila++) {
        ctx.fillStyle = PALETA.maderaFrente;
        ctx.fillRect(x + 3, y + 40 + fila * 33, w - 6, 3);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = colores[(fila * 2 + i) % colores.length];
          ctx.fillRect(x + 6 + i * 9, y + 14 + fila * 33, 7, 26);
        }
      }
      break;
    }
    case "lupa": {
      // una lupa grande sobre un pie: buscar huecos
      ctx.fillStyle = "#5a5f86";
      ctx.fillRect(cx - 3, y + 54, 6, h - 60);
      rectRedondo(ctx, cx - 18, y + h - 8, 36, 8, 3);
      rellenar(ctx, "#5a5f86");
      ctx.beginPath();
      ctx.arc(cx, y + 30, 22, 0, Math.PI * 2);
      rellenar(ctx, "rgba(190,225,245,0.4)");
      ctx.strokeStyle = PALETA.resalte;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.strokeStyle = PALETA.resalte;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx + 15, y + 46);
      ctx.lineTo(cx + 24, y + 58);
      ctx.stroke();
      break;
    }
    case "libreta": {
      // un atril con un cuaderno abierto: dejar constancia
      ctx.fillStyle = PALETA.maderaLado;
      ctx.fillRect(cx - 4, y + 50, 8, h - 56);
      rectRedondo(ctx, cx - 22, y + h - 8, 44, 8, 3);
      rellenar(ctx, PALETA.maderaLado);
      ctx.save();
      ctx.translate(cx, y + 36);
      ctx.rotate(-0.08);
      rectRedondo(ctx, -24, -20, 24, 38, 3);
      rellenar(ctx, PALETA.papel);
      rectRedondo(ctx, 0, -20, 24, 38, 3);
      rellenar(ctx, "#f1ecd6");
      ctx.fillStyle = "#b9bde0";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-20, -12 + i * 8, 16, 2);
        ctx.fillRect(4, -12 + i * 8, 16, 2);
      }
      ctx.restore();
      break;
    }
    case "servidor": {
      // un rack con luces que titilan: construir
      rectRedondo(ctx, x, y, w, h, 5);
      rellenar(ctx, PALETA.monitorMarco);
      for (let i = 0; i < 4; i++) {
        const yy = y + 8 + i * 24;
        rectRedondo(ctx, x + 5, yy, w - 10, 19, 3);
        rellenar(ctx, "#2b3050");
        const prendida = Math.sin(t * 5 + i * 1.9) > 0;
        ctx.beginPath();
        ctx.arc(x + 14, yy + 9.5, 3.5, 0, Math.PI * 2);
        rellenar(ctx, prendida ? PALETA.check : "#35604a");
        ctx.fillStyle = "#4a5078";
        ctx.fillRect(x + 24, yy + 7, w - 38, 3);
        ctx.fillRect(x + 24, yy + 12, w - 44, 3);
      }
      break;
    }
    case "dispositivos": {
      // un celular y una tablet sobre un pie: probar de punta a punta
      ctx.fillStyle = "#5a5f86";
      ctx.fillRect(cx - 3, y + 58, 6, h - 62);
      rectRedondo(ctx, cx - 18, y + h - 8, 36, 8, 3);
      rellenar(ctx, "#5a5f86");
      rectRedondo(ctx, x - 4, y + 14, 38, 46, 5);
      rellenar(ctx, PALETA.monitorMarco);
      rectRedondo(ctx, x, y + 18, 30, 36, 3);
      rellenar(ctx, PALETA.monitorPantalla);
      rectRedondo(ctx, x + 30, y + 30, 22, 36, 5);
      rellenar(ctx, PALETA.monitorMarco);
      rectRedondo(ctx, x + 33, y + 35, 16, 26, 2);
      rellenar(ctx, PALETA.monitorPantalla2);
      break;
    }
    case "portapapeles": {
      // un portapapeles gigante con tildes: revisión humana
      rectRedondo(ctx, x, y + 8, w, h - 8, 6);
      rellenar(ctx, PALETA.maderaFrente);
      rectRedondo(ctx, x + 5, y + 20, w - 10, h - 30, 3);
      rellenar(ctx, PALETA.papel);
      rectRedondo(ctx, cx - 11, y, 22, 14, 3);
      rellenar(ctx, "#8b8fb0");
      ctx.strokeStyle = PALETA.check;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 0; i < 4; i++) {
        const yy = y + 36 + i * 17;
        ctx.beginPath();
        ctx.moveTo(x + 10, yy);
        ctx.lineTo(x + 14, yy + 4);
        ctx.lineTo(x + 21, yy - 5);
        ctx.stroke();
        ctx.fillStyle = "#b9bde0";
        ctx.fillRect(x + 26, yy - 2, w - 38, 3);
      }
      break;
    }
    case "trofeo": {
      // el trofeo del final: dar el visto bueno
      rectRedondo(ctx, cx - 20, y + h - 14, 40, 14, 3);
      rellenar(ctx, PALETA.maderaLado);
      ctx.fillStyle = "#e0a91d";
      ctx.fillRect(cx - 5, y + 62, 10, h - 78);
      ctx.beginPath();
      ctx.moveTo(cx - 24, y + 14);
      ctx.lineTo(cx + 24, y + 14);
      ctx.lineTo(cx + 14, y + 62);
      ctx.lineTo(cx - 14, y + 62);
      ctx.closePath();
      rellenar(ctx, "#ffd54a");
      ctx.strokeStyle = "#e0a91d";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx - 26, y + 30, 11, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 26, y + 30, 11, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      const brillo = 0.4 + 0.6 * Math.max(0, Math.sin(t * 3));
      ctx.fillStyle = `rgba(255,255,255,${brillo})`;
      ctx.fillRect(cx - 12, y + 20, 5, 22);
      break;
    }
  }
}
