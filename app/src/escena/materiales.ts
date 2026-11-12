import * as THREE from "three";
import { mezclarHex } from "./identidad";

// Texturas de materiales reales (madera, alfombra, mármol, pared pintada), dibujadas en código con un lienzo 2D.
// Nada de imágenes ni archivos externos.

/** Un generador de números al azar que da siempre la misma secuencia para la misma semilla (así el piso se ve igual cada vez). */
export function aleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lienzo(ancho: number, alto: number): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = ancho;
  c.height = alto;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("No se pudo dibujar una textura");
  return { c, ctx };
}

function repetible(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Granitos suaves encima de lo ya dibujado: da aspecto de material y no de color liso. */
function granulado(ctx: CanvasRenderingContext2D, ancho: number, alto: number, azar: () => number, cantidad: number, fuerza: number) {
  for (let i = 0; i < cantidad; i++) {
    const claro = azar() > 0.5;
    ctx.fillStyle = claro ? `rgba(255,255,255,${fuerza * azar()})` : `rgba(0,0,0,${fuerza * azar()})`;
    ctx.fillRect(azar() * ancho, azar() * alto, 1 + azar() * 2, 1 + azar() * 2);
  }
}

/** Piso de madera: tablas con vetas, cada una de un tono apenas distinto y con su juntura. Un mosaico mide 160 × 160 unidades. */
export function texturaParquet(base: string): THREE.CanvasTexture {
  const T = 512;
  const { c, ctx } = lienzo(T, T);
  const azar = aleatorio(7);
  const ancho = T / 8;
  const largo = T / 2;
  for (let col = 0; col < 8; col++) {
    for (let fila = 0; fila < 2; fila++) {
      const y0 = fila * largo + (col % 2 === 0 ? 0 : largo / 2);
      const color = mezclarHex(base, azar() > 0.5 ? "#ffffff" : "#000000", 0.05 + azar() * 0.1);
      for (const y of [y0, y0 - T]) {
        ctx.fillStyle = color;
        ctx.fillRect(col * ancho, y, ancho, largo);
        ctx.strokeStyle = "rgba(60,35,15,0.18)";
        for (let v = 0; v < 7; v++) {
          const x = col * ancho + 4 + azar() * (ancho - 8);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + azar() * 6 - 3, y + largo * 0.3, x + azar() * 6 - 3, y + largo * 0.7, x + azar() * 4 - 2, y + largo);
          ctx.lineWidth = 0.6 + azar();
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(30,15,5,0.55)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(col * ancho, y, ancho, largo);
      }
    }
  }
  granulado(ctx, T, T, azar, 2200, 0.08);
  return repetible(c);
}

/** Alfombra: el color de la oficina con fibras apenas más claras y oscuras. */
export function texturaAlfombra(color: string): THREE.CanvasTexture {
  const T = 256;
  const { c, ctx } = lienzo(T, T);
  const azar = aleatorio(11);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, T, T);
  granulado(ctx, T, T, azar, 9000, 0.14);
  return repetible(c);
}

/** Baldosas grandes de mármol claro con vetas suaves y juntas finas. Un mosaico mide 300 × 300 unidades (2 × 2 baldosas). */
export function texturaBaldosas(): THREE.CanvasTexture {
  const T = 512;
  const { c, ctx } = lienzo(T, T);
  const azar = aleatorio(23);
  ctx.fillStyle = "#e8e5df";
  ctx.fillRect(0, 0, T, T);
  for (let i = 0; i < 26; i++) {
    ctx.strokeStyle = `rgba(120,115,108,${0.05 + azar() * 0.1})`;
    ctx.lineWidth = 0.6 + azar() * 1.6;
    ctx.beginPath();
    const x = azar() * T;
    const y = azar() * T;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + azar() * 140 - 70, y + azar() * 140 - 70, x + azar() * 200 - 100, y + azar() * 200 - 100, x + azar() * 260 - 130, y + azar() * 260 - 130);
    ctx.stroke();
  }
  granulado(ctx, T, T, azar, 1500, 0.05);
  ctx.strokeStyle = "rgba(90,86,80,0.7)";
  ctx.lineWidth = 3;
  for (const p of [0, T / 2]) {
    ctx.strokeRect(p, 0, T / 2, T);
    ctx.strokeRect(0, p, T, T / 2);
  }
  return repetible(c);
}

/** Pared pintada a mano: el color, unas manchas muy suaves y el grano del yeso. */
export function texturaYeso(color: string): THREE.CanvasTexture {
  const T = 256;
  const { c, ctx } = lienzo(T, T);
  const azar = aleatorio(31);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, T, T);
  // manchas grandes y suaves: rompen el color liso cuando la pared ocupa media pantalla
  for (let i = 0; i < 26; i++) {
    const x = azar() * T;
    const y = azar() * T;
    const r = 24 + azar() * 70;
    const mancha = ctx.createRadialGradient(x, y, 0, x, y, r);
    mancha.addColorStop(0, `rgba(255,255,255,${0.012 + azar() * 0.022})`);
    mancha.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = mancha;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  granulado(ctx, T, T, azar, 3500, 0.05);
  return repetible(c);
}

/** Cemento pulido para los pasillos y la losa del edificio. */
export function texturaCemento(): THREE.CanvasTexture {
  const T = 256;
  const { c, ctx } = lienzo(T, T);
  const azar = aleatorio(41);
  ctx.fillStyle = "#a9adb6";
  ctx.fillRect(0, 0, T, T);
  granulado(ctx, T, T, azar, 6000, 0.1);
  return repetible(c);
}

/** Madera de mueble: vetas largas en una sola dirección. */
export function texturaMadera(base: string): THREE.CanvasTexture {
  const T = 256;
  const { c, ctx } = lienzo(T, T);
  const azar = aleatorio(53);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, T, T);
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(70,40,15,${0.05 + azar() * 0.14})`;
    ctx.lineWidth = 0.6 + azar() * 1.8;
    const y = azar() * T;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(T * 0.3, y + azar() * 10 - 5, T * 0.7, y + azar() * 10 - 5, T, y + azar() * 6 - 3);
    ctx.stroke();
  }
  granulado(ctx, T, T, azar, 800, 0.05);
  return repetible(c);
}

/** Mismo material con su textura repetida cada `escala` unidades del mundo. */
export function conRepeticion(t: THREE.Texture, ancho: number, alto: number, escala: number): THREE.Texture {
  const r = t.clone();
  r.needsUpdate = true;
  r.repeat.set(ancho / escala, alto / escala);
  return r;
}

/** La cara de una persona (ojos con iris, cejas, sombra de la nariz y labios) sobre fondo transparente: se pega sobre la cabeza. */
export function texturaCaraReal(ojosAbiertos: boolean, colorCeja: string, colorIris: string): THREE.CanvasTexture {
  const S = 4;
  const { c, ctx } = lienzo(64 * S, 48 * S);
  ctx.scale(S, S);
  ctx.lineCap = "round";
  // sombra suave de la nariz
  const g = ctx.createRadialGradient(32, 31, 0.5, 32, 31, 7);
  g.addColorStop(0, "rgba(120,70,50,0.35)");
  g.addColorStop(1, "rgba(120,70,50,0)");
  ctx.fillStyle = g;
  ctx.fillRect(20, 20, 24, 20);
  for (const x of [17, 47]) {
    // ceja
    ctx.strokeStyle = colorCeja;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x - 8, 14.5);
    ctx.quadraticCurveTo(x, 11.2, x + 8, 14);
    ctx.stroke();
    if (ojosAbiertos) {
      ctx.fillStyle = "#f4f1ee";
      ctx.beginPath();
      ctx.ellipse(x, 21, 6.6, 3.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colorIris;
      ctx.beginPath();
      ctx.arc(x, 21, 3.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0d0d12";
      ctx.beginPath();
      ctx.arc(x, 21, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(x + 1.1, 19.8, 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2a1c18";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(x, 21, 6.7, 4, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#2a1c18";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x - 6.4, 21.4);
      ctx.quadraticCurveTo(x, 24.2, x + 6.4, 21.4);
      ctx.stroke();
    }
  }
  // boca
  ctx.fillStyle = "#b4625c";
  ctx.beginPath();
  ctx.moveTo(25, 38.5);
  ctx.quadraticCurveTo(32, 41.8, 39, 38.5);
  ctx.quadraticCurveTo(32, 36.6, 25, 38.5);
  ctx.fill();
  ctx.strokeStyle = "#7a3b38";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(25, 38.5);
  ctx.quadraticCurveTo(32, 40.2, 39, 38.5);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Piedra tallada en sillares: dos hiladas desfasadas. Un mosaico mide 120 × 52 unidades (como los ladrillos que usa el muro). */
export function texturaPiedra(): THREE.CanvasTexture {
  const { c, ctx } = lienzo(256, 111);
  const azar = aleatorio(61);
  const filas = [0, 55.5];
  const bloques: [number, number][][] = [[[0, 128], [128, 256]], [[-64, 64], [64, 192], [192, 320]]];
  filas.forEach((y, fila) => {
    for (const [x0, x1] of bloques[fila]) {
      ctx.fillStyle = mezclarHex("#bdb4a3", azar() > 0.5 ? "#ffffff" : "#4a4338", 0.04 + azar() * 0.1);
      ctx.fillRect(x0, y, x1 - x0, 55.5);
      ctx.strokeStyle = "rgba(55,48,40,0.65)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x0, y, x1 - x0, 55.5);
    }
  });
  granulado(ctx, 256, 111, azar, 2200, 0.1);
  return repetible(c);
}

/**
 * Un grabado moderno: papel oscuro, una forma grande apenas translúcida del color del agente y unas
 * líneas finas. Cada semilla da una obra distinta, sin colores de póster.
 */
export function texturaCuadro(color: string, semilla: number): THREE.CanvasTexture {
  const { c, ctx } = lienzo(256, 176);
  const azar = aleatorio(semilla * 17 + 3);
  const g = ctx.createLinearGradient(0, 0, 256, 176);
  g.addColorStop(0, "#1c1f27");
  g.addColorStop(1, "#0f1116");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 176);

  // la forma: un círculo fuera de centro, del color de la oficina
  ctx.globalAlpha = 0.18 + azar() * 0.1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(120 + azar() * 70, 60 + azar() * 40, 40 + azar() * 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // líneas finas, como las de un plano
  for (let i = 0; i < 7; i++) {
    const y = 24 + i * 19 + azar() * 4;
    const ancho = 60 + azar() * 150;
    ctx.strokeStyle = `rgba(232,228,218,${0.1 + azar() * 0.16})`;
    ctx.lineWidth = 0.8 + azar() * 1.1;
    ctx.beginPath();
    ctx.moveTo(22, y);
    ctx.lineTo(22 + ancho, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(232,228,218,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 12, 228, 152);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** La placa de bronce de una puerta: el número y el nombre de la oficina. */
export function texturaPlaca(numero: number, nombre: string, color: string): THREE.CanvasTexture {
  const S = 3;
  const { c, ctx } = lienzo(160 * S, 60 * S);
  ctx.scale(S, S);
  const g = ctx.createLinearGradient(0, 0, 160, 60);
  g.addColorStop(0, "#c9a25a");
  g.addColorStop(0.5, "#e6c880");
  g.addColorStop(1, "#b08a45");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 160, 60);
  ctx.strokeStyle = "rgba(60,40,10,0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, 154, 54);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(26, 30, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(numero), 26, 31);
  ctx.fillStyle = "#2b1d08";
  ctx.textAlign = "left";
  ctx.font = "800 17px system-ui, sans-serif";
  ctx.fillText(nombre, 50, 31);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Grava del patio: piedritas de varios grises sobre tierra oscura. Un mosaico mide 110 × 110 unidades. */
export function texturaGrava(): THREE.CanvasTexture {
  const T = 256;
  const { c, ctx } = lienzo(T, T);
  const azar = aleatorio(83);
  ctx.fillStyle = "#2b2823";
  ctx.fillRect(0, 0, T, T);
  for (let i = 0; i < 1400; i++) {
    const r = 1.4 + azar() * 3.6;
    const tono = 40 + Math.floor(azar() * 60);
    ctx.fillStyle = `rgb(${tono + 12}, ${tono + 9}, ${tono})`;
    ctx.beginPath();
    ctx.ellipse(azar() * T, azar() * T, r, r * (0.6 + azar() * 0.5), azar() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  granulado(ctx, T, T, azar, 3000, 0.12);
  return repetible(c);
}

/** Lamas verticales de roble: listones de madera con su sombra en la junta. Un mosaico mide 60 de ancho. */
export function texturaLamas(base = "#6b4a2f"): THREE.CanvasTexture {
  const T = 256;
  const { c, ctx } = lienzo(T, T);
  const azar = aleatorio(97);
  ctx.fillStyle = "#1a1510";
  ctx.fillRect(0, 0, T, T);
  const paso = T / 8;
  for (let i = 0; i < 8; i++) {
    const x = i * paso;
    ctx.fillStyle = mezclarHex(base, azar() > 0.5 ? "#ffffff" : "#000000", 0.06 + azar() * 0.12);
    ctx.fillRect(x + 1.5, 0, paso - 3, T);
    for (let v = 0; v < 12; v++) {
      ctx.strokeStyle = `rgba(30,18,8,${0.06 + azar() * 0.12})`;
      ctx.lineWidth = 0.7 + azar();
      const vx = x + 4 + azar() * (paso - 8);
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.bezierCurveTo(vx + 2, T * 0.35, vx - 2, T * 0.7, vx, T);
      ctx.stroke();
    }
    // luz que roza el canto del listón
    ctx.fillStyle = "rgba(255,225,180,0.05)";
    ctx.fillRect(x + paso - 3, 0, 2, T);
  }
  return repetible(c);
}

/** Agua con reflejos largos: se repite y se corre despacio para que parezca que se mueve. */
export function texturaAgua(): THREE.CanvasTexture {
  const T = 256;
  const { c, ctx } = lienzo(T, T);
  const azar = aleatorio(71);
  const g = ctx.createLinearGradient(0, 0, T, T);
  g.addColorStop(0, "#3d8fc4");
  g.addColorStop(1, "#6fc0e6");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, T, T);
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + azar() * 0.2})`;
    ctx.lineWidth = 1 + azar() * 2;
    const y = azar() * T;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(T * 0.3, y + 14 * (azar() - 0.5), T * 0.6, y + 14 * (azar() - 0.5), T, y);
    ctx.stroke();
  }
  return repetible(c);
}
