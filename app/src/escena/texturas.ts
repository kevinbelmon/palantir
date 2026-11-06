import * as THREE from "three";
import { iconoHoja, marcaDeBloques } from "../oficina/primitivas";

// Todas las texturas se dibujan en código con un lienzo 2D: no hay imágenes ni archivos externos.
const FUENTE = '"Segoe UI Variable Display","Segoe UI",system-ui,sans-serif';

function lienzo(ancho: number, alto: number): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = ancho;
  c.height = alto;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("No se pudo dibujar una textura");
  return { c, ctx };
}

function aTextura(c: HTMLCanvasElement, repetir = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function redondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function texto(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, tam: number, color: string, peso = 700, alinear: CanvasTextAlign = "left") {
  ctx.font = `${peso} ${tam}px ${FUENTE}`;
  ctx.fillStyle = color;
  ctx.textAlign = alinear;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s, x, y);
}

function envolver(ctx: CanvasRenderingContext2D, s: string, ancho: number): string[] {
  const renglones: string[] = [];
  let actual = "";
  for (const palabra of s.split(" ")) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && ctx.measureText(prueba).width > ancho) {
      renglones.push(actual);
      actual = palabra;
    } else actual = prueba;
  }
  if (actual) renglones.push(actual);
  return renglones;
}

/** Un sprite (siempre mira a la cámara) con una textura, de `ancho` x `alto` unidades del mundo. */
export function sprite(textura: THREE.Texture, ancho: number, alto: number): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, transparent: true, depthTest: false, depthWrite: false }));
  s.scale.set(ancho, alto, 1);
  s.renderOrder = 10;
  return s;
}

/** Ladrillos blancos: dos hiladas desfasadas. El mosaico mide 120 x 52 unidades del mundo. */
export const LADRILLO = { ancho: 120, alto: 52 } as const;
export function texturaLadrillos(): THREE.CanvasTexture {
  const { c, ctx } = lienzo(256, 111);
  ctx.fillStyle = "#f4f3ee";
  ctx.fillRect(0, 0, 256, 111);
  ctx.strokeStyle = "#d3d1c6";
  ctx.lineWidth = 3;
  const h = 111 / 2;
  ctx.beginPath();
  ctx.moveTo(0, 1.5);
  ctx.lineTo(256, 1.5);
  ctx.moveTo(0, h);
  ctx.lineTo(256, h);
  ctx.moveTo(0, 111 - 1.5);
  ctx.lineTo(256, 111 - 1.5);
  for (const x of [1.5, 128]) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (const x of [64, 192]) {
    ctx.moveTo(x, h);
    ctx.lineTo(x, 111);
  }
  ctx.stroke();
  return aTextura(c, true);
}

/** Código que pasa por una pantalla: renglones de largos distintos, que se repiten hacia arriba para poder moverlos. */
export function texturaPantalla(fondo: string): THREE.CanvasTexture {
  const { c, ctx } = lienzo(128, 256);
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < 16; i++) ctx.fillRect(10, 8 + i * 16, 34 + ((i * 37) % 70), 5);
  return aTextura(c, true);
}

export function texturaPizarra(lineas: readonly string[]): THREE.CanvasTexture {
  const S = 3;
  const { c, ctx } = lienzo(230 * S, 84 * S);
  ctx.scale(S, S);
  redondo(ctx, 1.5, 1.5, 227, 81, 8);
  ctx.fillStyle = "#f8f9ff";
  ctx.fill();
  ctx.strokeStyle = "#c9cde8";
  ctx.lineWidth = 3;
  ctx.stroke();
  lineas.forEach((l, i) => {
    const y = 25 + i * 22;
    ctx.strokeStyle = "#3ecf6e";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(14, y - 5);
    ctx.lineTo(20, y + 1);
    ctx.lineTo(30, y - 11);
    ctx.stroke();
    texto(ctx, l, 40, y, 15, "#3a3e5c", 600);
  });
  return aTextura(c);
}

export function texturaRotulo(numero: number, titulo: string, subtitulo: string, color: string): THREE.CanvasTexture {
  const S = 3;
  const { c, ctx } = lienzo(340 * S, 66 * S);
  ctx.scale(S, S);
  redondo(ctx, 0, 0, 340, 66, 16);
  ctx.fillStyle = "#1e2033";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(36, 33, 22, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  texto(ctx, String(numero), 36, 41, 24, "#ffffff", 800, "center");
  texto(ctx, titulo, 74, 30, 24, "#ffffff", 800);
  texto(ctx, subtitulo, 74, 54, 15, "#aab0d8", 500);
  return aTextura(c);
}

export function texturaEtiqueta(comando: string, camisa: string, punto: string): THREE.CanvasTexture {
  const S = 5;
  const { c, ctx } = lienzo(150 * S, 26 * S);
  ctx.scale(S, S);
  redondo(ctx, 0, 0, 150, 26, 13);
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(15, 13, 9.5, 0, Math.PI * 2);
  ctx.fillStyle = camisa;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(15, 11, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#f6d24a";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(33, 13, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = punto;
  ctx.fill();
  texto(ctx, comando, 43, 17.5, 11.5, "#2a2d4a", 700);
  return aTextura(c);
}

export function texturaGlobito(mensaje: string): THREE.CanvasTexture {
  const S = 3;
  const { c, ctx } = lienzo(262 * S, 100 * S);
  ctx.scale(S, S);
  redondo(ctx, 2, 2, 258, 88, 16);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#8e92c4";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(130, 90);
  ctx.lineTo(146, 99);
  ctx.lineTo(154, 90);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.font = `600 13px ${FUENTE}`;
  envolver(ctx, mensaje, 234)
    .slice(0, 4)
    .forEach((linea, i) => texto(ctx, linea, 14, 22 + i * 17, 13, "#2a2d4a", 600));
  return aTextura(c);
}

export function texturaCartelCentral(titulo: string, lema: string): THREE.CanvasTexture {
  const S = 2;
  const { c, ctx } = lienzo(800 * S, 150 * S);
  ctx.scale(S, S);
  redondo(ctx, 0, 0, 800, 150, 22);
  ctx.fillStyle = "#1e2033";
  ctx.fill();
  marcaDeBloques(ctx, 66, 75, 64);
  texto(ctx, titulo, 130, 68, 44, "#ffffff", 800);
  texto(ctx, lema, 132, 108, 24, "#aab0d8", 500);
  return aTextura(c);
}

export function texturaCara(ojosAbiertos: boolean): THREE.CanvasTexture {
  const S = 4;
  const { c, ctx } = lienzo(46 * S, 34 * S);
  ctx.scale(S, S);
  ctx.fillStyle = "#1d2133";
  if (ojosAbiertos) {
    ctx.fillRect(8, 6, 7, 9);
    ctx.fillRect(31, 6, 7, 9);
  } else {
    ctx.fillRect(8, 11, 7, 2);
    ctx.fillRect(31, 11, 7, 2);
  }
  ctx.strokeStyle = "#7a4a3a";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(23, 18, 9, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  return aTextura(c);
}

export function texturaInsignia(): THREE.CanvasTexture {
  const { c, ctx } = lienzo(128, 128);
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.fillStyle = "#3ecf6e";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(38, 66);
  ctx.lineTo(56, 84);
  ctx.lineTo(90, 44);
  ctx.stroke();
  return aTextura(c);
}

export function texturaSigno(): THREE.CanvasTexture {
  const { c, ctx } = lienzo(128, 128);
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd54a";
  ctx.fill();
  texto(ctx, "!", 64, 98, 92, "#1e2033", 900, "center");
  return aTextura(c);
}

/** Rayitas para la ruta: se repiten a lo largo de cada tramo y se pueden correr para que "avance". */
export function texturaGuiones(): THREE.CanvasTexture {
  const { c, ctx } = lienzo(64, 16);
  ctx.fillStyle = "#ffffff";
  redondo(ctx, 2, 3, 38, 10, 5);
  ctx.fill();
  return aTextura(c, true);
}

/** Cartel chico con una hoja dibujada, un título y una línea de ayuda: el de la papelería. */
export function texturaCartelChico(titulo: string, sub: string): THREE.CanvasTexture {
  const S = 3;
  const { c, ctx } = lienzo(260 * S, 66 * S);
  ctx.scale(S, S);
  redondo(ctx, 0, 0, 260, 66, 16);
  ctx.fillStyle = "#1e2033";
  ctx.fill();
  iconoHoja(ctx, 34, 33, 34);
  texto(ctx, titulo, 68, 30, 24, "#ffffff", 800);
  texto(ctx, sub, 68, 54, 15, "#aab0d8", 500);
  return aTextura(c);
}
