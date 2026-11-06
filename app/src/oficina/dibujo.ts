import type { EstadoAgente, UbicacionBrief } from "../flujo";
import { etiquetaDeEstado, textoEtiqueta, textosDe } from "../contenido";
import { AGENTES } from "../flujo";
import type { Camara } from "./camara";
import { CARTEL_CENTRAL, LOBBY, MUNDO, PAPELERIA, rectBrief, rectDocumento, SALAS, type Rect, type Sala } from "./mundo";
import { BEBEDERO, COLEGAS_REVIEW, MESA_REDONDA_REVIEW, OBJETOS_SALA, PLANTAS, SILLON } from "./decoracion";
import { dibujarObjeto } from "./objetos";
import { estadoDeSegmento, puntoEnRuta, RUTA } from "./ruta";
import { ladrillosEn, tacosEn, tirasDeMuro } from "./bloques";
import { posicionEtiqueta } from "./etiquetas";
import { APARIENCIAS, COLORES_ESTADO, PALETA } from "./paleta";
import { dibujarPersonaje } from "./personajes";
import { caja, type Ctx, envolver, FUENTE, iconoHoja, marcaDeBloques, rectRedondo, rellenar, sombra, texto } from "./primitivas";

export type VistaDibujo = {
  ancho: number;
  alto: number;
  dpr: number;
  camara: Camara;
  agentes: readonly EstadoAgente[];
  brief: UbicacionBrief;
  /** Segundos desde que arrancó el juego: mueve las animaciones. */
  tiempo: number;
};

const PARED = 130;

export function dibujarOficina(ctx: Ctx, v: VistaDibujo): void {
  const { camara: c, dpr } = v;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, v.ancho * dpr, v.alto * dpr);
  ctx.fillStyle = PALETA.fondo;
  ctx.fillRect(0, 0, v.ancho * dpr, v.alto * dpr);
  ctx.setTransform(c.zoom * dpr, 0, 0, c.zoom * dpr, -c.x * c.zoom * dpr, -c.y * c.zoom * dpr);

  dibujarEdificio(ctx);
  dibujarRuta(ctx, v);
  dibujarLobby(ctx);
  dibujarPapeleria(ctx, v);
  SALAS.forEach((sala, i) => dibujarSala(ctx, sala, i, v));
  dibujarDecoracion(ctx);
  vineta(ctx, v);
}

function dibujarPlanta(ctx: Ctx, x: number, y: number) {
  sombra(ctx, x, y + 6, 26, 8, 0.2);
  ctx.fillStyle = PALETA.planta;
  for (const [dx, dy, r] of [[-14, -34, 17], [14, -36, 17], [0, -52, 19], [-4, -26, 20]] as const) {
    ctx.beginPath();
    ctx.ellipse(x + dx, y + dy, r * 0.8, r, dx * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETA.plantaOscura;
  ctx.beginPath();
  ctx.ellipse(x + 8, y - 30, 9, 15, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 14);
  ctx.lineTo(x + 20, y - 14);
  ctx.lineTo(x + 15, y + 6);
  ctx.lineTo(x - 15, y + 6);
  ctx.closePath();
  rellenar(ctx, PALETA.maceta);
}

function dibujarSillon(ctx: Ctx, s: Rect) {
  sombra(ctx, s.x + s.w / 2, s.y + s.h + 10, s.w / 2, 10);
  rectRedondo(ctx, s.x, s.y - 34, s.w, 52, 14);
  rellenar(ctx, PALETA.sillon);
  rectRedondo(ctx, s.x - 14, s.y - 10, 30, s.h, 12);
  rellenar(ctx, PALETA.sillonClaro);
  rectRedondo(ctx, s.x + s.w - 16, s.y - 10, 30, s.h, 12);
  rellenar(ctx, PALETA.sillonClaro);
  rectRedondo(ctx, s.x + 12, s.y + 6, s.w - 24, s.h - 14, 12);
  rellenar(ctx, PALETA.sillonClaro);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(s.x + s.w / 2 - 1, s.y + 8, 2, s.h - 18);
}

function dibujarBebedero(ctx: Ctx, b: Rect) {
  sombra(ctx, b.x + b.w / 2, b.y + b.h + 6, 30, 8);
  rectRedondo(ctx, b.x, b.y + 30, b.w, b.h - 30, 8);
  rellenar(ctx, "#e6e8f5");
  ctx.fillStyle = "#9aa0c8";
  ctx.fillRect(b.x + 12, b.y + 52, 10, 10);
  ctx.fillRect(b.x + 28, b.y + 52, 10, 10);
  rectRedondo(ctx, b.x + 6, b.y - 24, b.w - 12, 58, 18);
  rellenar(ctx, PALETA.agua);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(b.x + 14, b.y - 16, 6, 36);
}

function dibujarDecoracion(ctx: Ctx) {
  dibujarSillon(ctx, SILLON);
  dibujarBebedero(ctx, BEBEDERO);
  // mesa baja del lobby
  ctx.beginPath();
  ctx.ellipse(1080, 972, 56, 24, 0, 0, Math.PI * 2);
  rellenar(ctx, PALETA.maderaTapa);
  ctx.beginPath();
  ctx.ellipse(1080, 984, 56, 24, 0, 0, Math.PI);
  rellenar(ctx, PALETA.maderaLado);
  for (const p of PLANTAS) dibujarPlanta(ctx, p.x, p.y);
}

/** Mesa redonda de reuniones con sus notebooks. */
function dibujarMesaRedonda(ctx: Ctx) {
  const m = MESA_REDONDA_REVIEW;
  sombra(ctx, m.x, m.y + m.ry + 12, m.rx, 14);
  ctx.beginPath();
  ctx.ellipse(m.x, m.y + 18, m.rx, m.ry, 0, 0, Math.PI * 2);
  rellenar(ctx, PALETA.maderaLado);
  ctx.beginPath();
  ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
  rellenar(ctx, PALETA.maderaTapa);
  for (const [dx, dy] of [[-80, -10], [80, -10], [0, 50]] as const) {
    rectRedondo(ctx, m.x + dx - 24, m.y + dy - 14, 48, 30, 4);
    rellenar(ctx, "#3a3f5f");
    rectRedondo(ctx, m.x + dx - 20, m.y + dy - 11, 40, 22, 2);
    rellenar(ctx, PALETA.monitorPantalla);
  }
}

/** La sala de vidrio: paredes transparentes con reflejos. */
function vidrio(ctx: Ctx, a: Rect) {
  ctx.fillStyle = PALETA.vidrio;
  ctx.fillRect(a.x, a.y + PARED, a.w, a.h - PARED);
  ctx.save();
  ctx.beginPath();
  ctx.rect(a.x, a.y + PARED, a.w, a.h - PARED);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  for (let i = -2; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(a.x + i * 150, a.y + a.h);
    ctx.lineTo(a.x + i * 150 + 70, a.y + a.h);
    ctx.lineTo(a.x + i * 150 + 70 + 380, a.y + PARED);
    ctx.lineTo(a.x + i * 150 + 380, a.y + PARED);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = PALETA.vidrioBorde;
  ctx.lineWidth = 8;
  ctx.strokeRect(a.x, a.y, a.w, a.h);
}

function dibujarEdificio(ctx: Ctx) {
  rectRedondo(ctx, 60, 60, MUNDO.ancho - 120, MUNDO.alto - 120, 28);
  rellenar(ctx, PALETA.edificio);
  rectRedondo(ctx, 60, 60, MUNDO.ancho - 120, MUNDO.alto - 120, 28);
  ctx.strokeStyle = PALETA.muro;
  ctx.lineWidth = 10;
  ctx.stroke();
}

const PASO_TACO = 28;
let fichaDeTacos: HTMLCanvasElement | null = null;

/** Un casillero de piso con su taco, que se repite como patrón. Se dibuja una sola vez. */
function ficha(): HTMLCanvasElement {
  if (fichaDeTacos) return fichaDeTacos;
  const c = document.createElement("canvas");
  c.width = PASO_TACO;
  c.height = PASO_TACO;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "rgba(0, 0, 0, 0.16)";
    g.beginPath();
    g.arc(14.5, 15.5, 9.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255, 255, 255, 0.22)";
    g.beginPath();
    g.arc(13.5, 13.5, 9, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(0, 0, 0, 0.12)";
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = "rgba(255, 255, 255, 0.3)";
    g.beginPath();
    g.ellipse(11, 11, 3.5, 2.5, -0.6, 0, Math.PI * 2);
    g.fill();
  }
  fichaDeTacos = c;
  return c;
}

/** Piso de placa de bloques: un color liso con tacos. */
function piso(ctx: Ctx, r: Rect, base: string) {
  ctx.fillStyle = base;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const patron = ctx.createPattern(ficha(), "repeat");
  if (!patron) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.fillStyle = patron;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

const ladrillosEnCache = new Map<string, Rect[]>();
function ladrillosCacheados(r: Rect, alto: number, largo: number): Rect[] {
  const clave = `${r.x},${r.y},${r.w},${r.h},${alto},${largo}`;
  let l = ladrillosEnCache.get(clave);
  if (!l) {
    l = ladrillosEn(r, alto, largo);
    ladrillosEnCache.set(clave, l);
  }
  return l;
}

/** Pared de ladrillos blancos: las juntas de cada hilada, desfasadas. */
function paredDeLadrillos(ctx: Ctx, r: Rect, alto: number, largo: number) {
  ctx.fillStyle = PALETA.pared;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = PALETA.ladrilloLinea;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const b of ladrillosCacheados(r, alto, largo)) ctx.rect(b.x, b.y, b.w, b.h);
  ctx.stroke();
}

function dibujarLobby(ctx: Ctx) {
  piso(ctx, LOBBY, PALETA.sueloLobby);

  // alfombra central
  rectRedondo(ctx, LOBBY.x + 150, LOBBY.y + 60, LOBBY.w - 300, LOBBY.h - 120, 40);
  rellenar(ctx, PALETA.alfombra);

  // cartel central con el nombre del modelo
  const a = CARTEL_CENTRAL.area;
  sombra(ctx, a.x + a.w / 2, a.y + a.h + 14, a.w / 2.1, 12);
  rectRedondo(ctx, a.x, a.y, a.w, a.h, 22);
  rellenar(ctx, PALETA.cartelFondo);
  marcaDeBloques(ctx, a.x + 66, a.y + a.h / 2, 64);
  texto(ctx, CARTEL_CENTRAL.titulo, a.x + 130, a.y + 68, { tam: 44, color: PALETA.cartelTexto, peso: 800 });
  texto(ctx, CARTEL_CENTRAL.lema, a.x + 132, a.y + 108, { tam: 24, color: PALETA.cartelSub, peso: 500 });
}

function cartel(ctx: Ctx, cx: number, y: number, numero: number, titulo: string, subtitulo: string, color: string) {
  const w = 340;
  const h = 66;
  sombra(ctx, cx, y + h + 8, w / 2.3, 8, 0.25);
  rectRedondo(ctx, cx - w / 2, y, w, h, 16);
  rellenar(ctx, PALETA.cartelFondo);
  ctx.beginPath();
  ctx.arc(cx - w / 2 + 36, y + h / 2, 22, 0, Math.PI * 2);
  rellenar(ctx, color);
  texto(ctx, String(numero), cx - w / 2 + 36, y + h / 2 + 8, { tam: 24, color: "#fff", peso: 800, alinear: "center" });
  texto(ctx, titulo, cx - w / 2 + 74, y + 30, { tam: 24, color: PALETA.cartelTexto, peso: 800 });
  texto(ctx, subtitulo, cx - w / 2 + 74, y + 54, { tam: 15, color: PALETA.cartelSub, peso: 500 });
}

function pizarra(ctx: Ctx, r: Rect, lineas: readonly string[]) {
  rectRedondo(ctx, r.x, r.y, r.w, r.h, 8);
  rellenar(ctx, PALETA.pizarraFondo);
  rectRedondo(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.strokeStyle = PALETA.pizarraBorde;
  ctx.lineWidth = 3;
  ctx.stroke();
  lineas.forEach((l, i) => {
    const y = r.y + 25 + i * 22;
    ctx.strokeStyle = PALETA.check;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(r.x + 14, y - 5);
    ctx.lineTo(r.x + 20, y + 1);
    ctx.lineTo(r.x + 30, y - 11);
    ctx.stroke();
    texto(ctx, l, r.x + 40, y, { tam: 15, color: PALETA.pizarraTexto, peso: 600 });
  });
}

/** Muros de ladrillos blancos, con tacos arriba y una puerta hacia el lobby. */
function muros(ctx: Ctx, a: Rect, puerta: "abajo" | "arriba" | "izquierda") {
  const tiras = tirasDeMuro(a, puerta).map((x) => x.rect);

  for (const t of tiras) {
    sombra(ctx, t.x + t.w / 2 + 3, t.y + t.h / 2 + 4, t.w / 2 + 3, t.h / 2 + 3, 0.12);
    paredDeLadrillos(ctx, t, 8, 30);
    ctx.fillStyle = "#ffffff";
    for (const p of tacosEn(t, 16)) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function escritorio(ctx: Ctx, e: Rect, t: number, activo: boolean) {
  sombra(ctx, e.x + e.w / 2, e.y + e.h + 6, e.w / 2, 10);
  caja(ctx, e.x, e.y + 30, e.w, e.h - 30, 28, { frente: PALETA.maderaFrente, tapa: PALETA.maderaTapa, lado: PALETA.maderaLado });
  // tacos sobre la tapa del escritorio
  ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
  for (const p of tacosEn({ x: e.x + 14, y: e.y + 10, w: e.w - 6, h: 20 }, 16)) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // monitores
  for (const mx of [e.x + 26, e.x + e.w - 100]) {
    ctx.fillStyle = "#3a3f5f";
    ctx.fillRect(mx + 30, e.y + 2, 14, 24);
    rectRedondo(ctx, mx, e.y - 54, 76, 56, 6);
    rellenar(ctx, PALETA.monitorMarco);
    rectRedondo(ctx, mx + 5, e.y - 49, 66, 44, 3);
    rellenar(ctx, mx < e.x + e.w / 2 ? PALETA.monitorPantalla : PALETA.monitorPantalla2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 4; i++) {
      const largo = 20 + ((i * 17 + Math.floor(activo ? t * 4 : 0) * 7) % 34);
      ctx.fillRect(mx + 11, e.y - 43 + i * 9, largo, 3);
    }
  }
  // teclado y taza
  rectRedondo(ctx, e.x + e.w / 2 - 44, e.y + 10, 88, 16, 4);
  rellenar(ctx, "#3a3f5f");
  ctx.beginPath();
  ctx.arc(e.x + e.w - 130, e.y + 14, 9, 0, Math.PI * 2);
  rellenar(ctx, "#ffffff");
  // vapor de la taza
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (let k = 0; k < 2; k++) {
    const bx = e.x + e.w - 133 + k * 6;
    ctx.beginPath();
    ctx.moveTo(bx, e.y + 4);
    ctx.quadraticCurveTo(bx + Math.sin(t * 3 + k) * 5, e.y - 6, bx, e.y - 14);
    ctx.stroke();
  }
}

function silla(ctx: Ctx, x: number, y: number) {
  rectRedondo(ctx, x - 40, y - 28, 80, 104, 16);
  rellenar(ctx, PALETA.sillaColor);
}

function dibujarSala(ctx: Ctx, sala: Sala, indice: number, v: VistaDibujo) {
  const a = sala.area;
  const textos = textosDe(AGENTES[indice].id);
  const estado = v.agentes[indice] ?? "deshabilitado";

  // suelo y pared del fondo
  // piso de bloques con tacos y pared del fondo de ladrillos blancos
  piso(ctx, a, PALETA.sueloSala);
  paredDeLadrillos(ctx, { x: a.x, y: a.y, w: a.w, h: PARED }, 26, 52);
  ctx.fillStyle = PALETA.zocalo;
  ctx.fillRect(a.x, a.y + PARED - 12, a.w, 12);

  const esVidrio = sala.tipo === "vidrio";
  if (!esVidrio) muros(ctx, a, a.y < LOBBY.y ? "abajo" : "arriba");

  pizarra(ctx, sala.pizarra, textos.pizarra);
  const objeto = OBJETOS_SALA.find((o) => o.sala === indice);
  if (objeto) dibujarObjeto(ctx, objeto, v.tiempo);

  const { x: px, y: py } = sala.personaje;
  if (estado === "habilitado") halo(ctx, sala, v.tiempo);
  silla(ctx, px, py);
  if (esVidrio) {
    // sala de reuniones: mesa redonda con colegas sentados alrededor
    for (const c of COLEGAS_REVIEW) {
      silla(ctx, c.x, c.y);
      dibujarPersonaje(ctx, c.x, c.y, c.indice, "terminado", v.tiempo);
    }
    dibujarPersonaje(ctx, px, py, indice, estado, v.tiempo);
    dibujarMesaRedonda(ctx);
    vidrio(ctx, a);
  } else {
    dibujarPersonaje(ctx, px, py, indice, estado, v.tiempo);
    escritorio(ctx, sala.escritorio, v.tiempo, estado === "corriendo");
  }

  if (typeof v.brief === "object" && v.brief.agente === indice) briefEnEscritorio(ctx, sala);
  if (estado === "terminado") documentoListo(ctx, sala, v.tiempo);
  if (estado === "habilitado") signoDeAviso(ctx, sala, v.tiempo);
  if (estado === "corriendo") globito(ctx, areaGlobito(sala), textos.globito, v.tiempo);

  cartel(ctx, a.x + a.w / 2, a.y - 36, sala.numero, textos.nombre, textos.subtitulo, colorDeSala(indice));
  if (estado === "terminado") insigniaListo(ctx, a.x + a.w / 2 + 170, a.y - 34);
  etiquetaDeAgente(ctx, sala, indice, estado);
}

/** Aro amarillo que late alrededor del escritorio del agente que espera la orden. */
function halo(ctx: Ctx, sala: Sala, t: number) {
  const e = sala.escritorio;
  const pulso = 0.5 + 0.5 * Math.sin(t * 4);
  ctx.save();
  ctx.strokeStyle = `rgba(255, 213, 74, ${0.4 + 0.45 * pulso})`;
  ctx.lineWidth = 8;
  ctx.shadowColor = PALETA.resalte;
  ctx.shadowBlur = 26;
  rectRedondo(ctx, e.x - 26, e.y - 74, e.w + 52, e.h + 100, 28);
  ctx.stroke();
  ctx.restore();
}

/** El documento que dejó el agente al terminar: late un poco para invitar a abrirlo. */
function documentoListo(ctx: Ctx, sala: Sala, t: number) {
  const { x, y } = rectDocumento(sala);
  const pulso = 0.5 + 0.5 * Math.sin(t * 4);
  ctx.save();
  ctx.shadowColor = PALETA.resalte;
  ctx.shadowBlur = 10 + 14 * pulso;
  rectRedondo(ctx, x, y, 44, 30, 4);
  rellenar(ctx, PALETA.papel);
  ctx.restore();
  ctx.fillStyle = PALETA.check;
  ctx.fillRect(x + 6, y + 6, 18, 3);
  ctx.fillStyle = "#b9bde0";
  ctx.fillRect(x + 6, y + 13, 32, 3);
  ctx.fillRect(x + 6, y + 20, 24, 3);
}

/** Signo de admiración que rebota sobre la cabeza: "tocame". */
function signoDeAviso(ctx: Ctx, sala: Sala, t: number) {
  const { x, y } = sala.personaje;
  const rebote = Math.sin(t * 5) * 7;
  ctx.beginPath();
  ctx.arc(x + 92, y - 104 + rebote, 19, 0, Math.PI * 2);
  rellenar(ctx, PALETA.resalte);
  texto(ctx, "!", x + 92, y - 96 + rebote, { tam: 28, color: "#1e2033", peso: 900, alinear: "center" });
}

/** Dónde va el globito de cada sala: en un lugar libre, al lado del personaje. */
function areaGlobito(sala: Sala): Rect {
  const a = sala.area;
  return sala.tipo === "vidrio" ? { x: a.x + 20, y: a.y + 130, w: 262, h: 92 } : { x: a.x + 16, y: a.y + 8, w: 262, h: 92 };
}

function globito(ctx: Ctx, r: Rect, mensaje: string, t: number) {
  sombra(ctx, r.x + r.w / 2, r.y + r.h + 6, r.w / 2.2, 6, 0.2);
  rectRedondo(ctx, r.x, r.y, r.w, r.h, 16);
  rellenar(ctx, "#ffffff");
  rectRedondo(ctx, r.x, r.y, r.w, r.h, 16);
  ctx.strokeStyle = "#8e92c4";
  ctx.lineWidth = 3;
  ctx.stroke();
  // piquito hacia el personaje
  ctx.beginPath();
  ctx.moveTo(r.x + r.w - 2, r.y + r.h - 34);
  ctx.lineTo(r.x + r.w + 18, r.y + r.h - 22);
  ctx.lineTo(r.x + r.w - 2, r.y + r.h - 14);
  rellenar(ctx, "#ffffff");

  ctx.font = `600 13px ${FUENTE}`;
  envolver(ctx, mensaje, r.w - 28).slice(0, 4).forEach((linea, i) => {
    texto(ctx, linea, r.x + 14, r.y + 22 + i * 17, { tam: 13, color: "#2a2d4a", peso: 600 });
  });
  for (let i = 0; i < 3; i++) {
    const alfa = 0.25 + 0.75 * Math.max(0, Math.sin(t * 6 - i * 0.9));
    ctx.beginPath();
    ctx.arc(r.x + 22 + i * 14, r.y + r.h - 12, 4, 0, Math.PI * 2);
    rellenar(ctx, `rgba(91, 140, 255, ${alfa})`);
  }
}

/** Tilde verde sobre el cartel de la sala: este agente ya terminó. */
function insigniaListo(ctx: Ctx, x: number, y: number) {
  sombra(ctx, x, y + 22, 14, 4, 0.25);
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  rellenar(ctx, PALETA.check);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.lineTo(x - 2, y + 6);
  ctx.lineTo(x + 8, y - 6);
  ctx.stroke();
}

/** El brief sobre el escritorio (o la mesa) del agente que lo tiene ahora. */
function briefEnEscritorio(ctx: Ctx, sala: Sala) {
  const { x, y } = rectBrief(sala);
  rectRedondo(ctx, x, y, 44, 30, 4);
  rellenar(ctx, PALETA.papel);
  ctx.fillStyle = "#b9bde0";
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 6, y + 6 + i * 7, 32 - (i === 2 ? 12 : 0), 3);
}

function colorDeSala(indice: number): string {
  return ["#5b8cff", "#8e6bff", "#3ecf6e", "#f2a33a", "#ff6b81", "#2ec4b6", "#e3b72a", "#7d82b8"][indice];
}

function dibujarPapeleria(ctx: Ctx, v: VistaDibujo) {
  const a = PAPELERIA;
  piso(ctx, a, PALETA.sueloSala);
  paredDeLadrillos(ctx, { x: a.x, y: a.y, w: a.w, h: 110 }, 22, 52);
  ctx.fillStyle = PALETA.zocalo;
  ctx.fillRect(a.x, a.y + 98, a.w, 12);
  muros(ctx, a, "arriba");

  // estantería con carpetas
  const colores = ["#5b8cff", "#f2a33a", "#3ecf6e", "#ff6b81", "#8e6bff", "#2ec4b6"];
  ctx.fillStyle = PALETA.maderaLado;
  ctx.fillRect(a.x + 40, a.y + 60, 190, 8);
  colores.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(a.x + 48 + i * 30, a.y + 22, 22, 38);
  });

  // mesa con bandeja
  const mesa = { x: a.x + 70, y: a.y + 230, w: 280, h: 90 };
  sombra(ctx, mesa.x + mesa.w / 2, mesa.y + mesa.h + 8, mesa.w / 2, 10);
  caja(ctx, mesa.x, mesa.y + 28, mesa.w, mesa.h - 28, 26, { frente: PALETA.maderaFrente, tapa: PALETA.maderaTapa, lado: PALETA.maderaLado });
  rectRedondo(ctx, mesa.x + 70, mesa.y + 6, 140, 26, 6);
  rellenar(ctx, "#5a5f86");

  // el brief: pulsa si todavía hay que dejarlo
  const hayBrief = v.brief === "papeleria";
  const latido = v.brief === "mano" ? 1 + Math.sin(v.tiempo * 4) * 0.07 : 1;
  if (hayBrief || v.brief === "mano") {
    ctx.save();
    ctx.translate(mesa.x + 140, mesa.y - 6);
    ctx.scale(latido, latido);
    if (v.brief === "mano") {
      ctx.shadowColor = PALETA.resalte;
      ctx.shadowBlur = 28;
    }
    rectRedondo(ctx, -42, -34, 84, 58, 6);
    rellenar(ctx, PALETA.papel);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#b9bde0";
    for (let i = 0; i < 4; i++) ctx.fillRect(-32, -24 + i * 11, 64 - (i === 3 ? 28 : 0), 4);
    ctx.restore();
  }

  // cartel de la papelería, sobre la pared del fondo (no pisa a la sala de arriba)
  const sx = a.x + a.w / 2;
  sombra(ctx, sx + 60, a.y + 86, 130, 7, 0.22);
  rectRedondo(ctx, sx - 30, a.y + 14, 230, 66, 16);
  rellenar(ctx, PALETA.cartelFondo);
  iconoHoja(ctx, sx + 2, a.y + 47, 34);
  texto(ctx, "Papelería", sx + 30, a.y + 44, { tam: 24, color: PALETA.cartelTexto, peso: 800 });
  texto(ctx, "Dejá acá el brief", sx + 30, a.y + 66, { tam: 15, color: PALETA.cartelSub, peso: 500 });
}

/** La ruta del brief por los pasillos: verde lo hecho, amarillo lo que sigue (con un papelito que viaja), tenue lo pendiente. */
function dibujarRuta(ctx: Ctx, v: VistaDibujo) {
  RUTA.forEach((tramo, i) => {
    const estado = estadoDeSegmento(i, v.agentes);
    const color = estado === "hecho" ? PALETA.check : estado === "activo" ? PALETA.resalte : "rgba(60, 70, 110, 0.3)";
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = estado === "pendiente" ? 6 : 8;
    if (estado === "activo") {
      ctx.shadowColor = PALETA.resalte;
      ctx.shadowBlur = 16;
      ctx.setLineDash([18, 14]);
      ctx.lineDashOffset = -v.tiempo * 60;
    } else if (estado === "pendiente") {
      ctx.setLineDash([14, 16]);
    }
    ctx.beginPath();
    tramo.forEach((p, k) => (k === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // punta de flecha al llegar a la puerta
    const fin = tramo[tramo.length - 1];
    const antes = tramo[tramo.length - 2];
    const ang = Math.atan2(fin.y - antes.y, fin.x - antes.x);
    ctx.translate(fin.x, fin.y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(-16, -11);
    ctx.lineTo(-16, 11);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // el papelito del brief que viaja por el tramo activo
    if (estado === "activo") {
      const q = puntoEnRuta(tramo, (v.tiempo * 0.15) % 1);
      ctx.save();
      ctx.shadowColor = PALETA.resalte;
      ctx.shadowBlur = 14;
      rectRedondo(ctx, q.x - 13, q.y - 9, 26, 18, 3);
      rellenar(ctx, PALETA.papel);
      ctx.restore();
    }
  });
}

/** Bordes apenas más oscuros, para que la mirada vaya al centro. */
function vineta(ctx: Ctx, v: VistaDibujo) {
  ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
  const g = ctx.createRadialGradient(v.ancho / 2, v.alto / 2, Math.min(v.ancho, v.alto) * 0.35, v.ancho / 2, v.alto / 2, Math.max(v.ancho, v.alto) * 0.75);
  g.addColorStop(0, "rgba(10, 10, 30, 0)");
  g.addColorStop(1, "rgba(10, 10, 30, 0.4)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, v.ancho, v.alto);
}

/** La etiqueta que flota sobre cada personaje: su avatar, un punto de estado y el nombre de su comando. */
function etiquetaDeAgente(ctx: Ctx, sala: Sala, indice: number, estado: EstadoAgente) {
  const r = posicionEtiqueta(sala);
  const punto = COLORES_ESTADO[etiquetaDeEstado(estado).color];
  sombra(ctx, r.x + r.w / 2, r.y + r.h + 4, r.w / 2.2, 4, 0.22);
  rectRedondo(ctx, r.x, r.y, r.w, r.h, 13);
  rellenar(ctx, "rgba(255, 255, 255, 0.96)");
  ctx.beginPath();
  ctx.arc(r.x + 15, r.y + 13, 9.5, 0, Math.PI * 2);
  rellenar(ctx, APARIENCIAS[indice % APARIENCIAS.length].camisa);
  ctx.beginPath();
  ctx.arc(r.x + 15, r.y + 11, 5, 0, Math.PI * 2);
  rellenar(ctx, PALETA.piel);
  ctx.beginPath();
  ctx.arc(r.x + 33, r.y + 13, 4.5, 0, Math.PI * 2);
  rellenar(ctx, punto);
  texto(ctx, textoEtiqueta(indice), r.x + 43, r.y + 17.5, { tam: 11.5, color: "#2a2d4a", peso: 700 });
}
