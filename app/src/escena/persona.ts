import { type Elemento, LOBBY, MUNDO, PAPELERIA, rectDocumento, SALAS, tirasDeMuro, type Rect, type Sala } from "../oficina";
import { BEBEDERO, ESTANTE_PAPELERIA, OBJETOS_SALA, PLANTAS, SILLON } from "../oficina/decoracion";
import { obstaculosDeMuebles } from "./distribucion";
import { marcoDePuerta } from "./identidad";

/** Dónde está la persona que recorre la oficina y hacia dónde mira. `yaw` 0 mira al norte (hacia arriba en el plano). */
export type Jugador = { x: number; z: number; yaw: number; pitch: number };

/** La altura de los ojos y el radio del cuerpo, en unidades del mundo (un escritorio mide 66). */
export const ALTURA_OJOS = 140;
export const RADIO_JUGADOR = 26;
/** Alto de los techos cuando se recorre por adentro. */
export const ALTURA_TECHO = 235;
const CAMINAR = 210;
const CORRER = 380;
const ALCANCE = 250;
const ANGULO_MAXIMO = 0.8;

/** Arranca en el lobby, mirando hacia el cartel central. */
export const JUGADOR_INICIAL: Jugador = { x: 1210, z: 1060, yaw: 0, pitch: 0 };

export type Entrada = { adelante: number; lateral: number; correr: boolean };

const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

const puertaDe = (s: Sala): "abajo" | "arriba" | "izquierda" => (s.tipo === "vidrio" ? "izquierda" : s.area.y < LOBBY.y ? "abajo" : "arriba");

/** Mesa de la papelería: lo que se toca para dejar el brief. */
const MESA_PAPELERIA = rect(PAPELERIA.x + 70, PAPELERIA.y + 230, 280, 90);

/** Todo lo que no se puede atravesar: paredes, marcos de puerta, muebles y los agentes sentados. */
export function obstaculos(): Rect[] {
  const lista: Rect[] = [];
  for (const area of [...SALAS.map((s) => ({ area: s.area, puerta: puertaDe(s) })), { area: PAPELERIA, puerta: "arriba" as const }]) {
    for (const t of tirasDeMuro(area.area, area.puerta, 16)) lista.push(t.rect);
  }
  const borde = 22;
  lista.push(
    rect(60 - borde, 60 - borde, MUNDO.ancho - 120 + borde * 2, borde),
    rect(60 - borde, MUNDO.alto - 60, MUNDO.ancho - 120 + borde * 2, borde),
    rect(60 - borde, 60, borde, MUNDO.alto - 120),
    rect(MUNDO.ancho - 60, 60, borde, MUNDO.alto - 120),
  );
  for (const s of SALAS) {
    for (const p of marcoDePuerta(s).postes) lista.push(p);
    const e = s.escritorio;
    if (s.tipo === "vidrio") lista.push(rect(s.area.x + 280 - 150, s.area.y + 520 - 100, 300, 200));
    else lista.push(rect(e.x - 6, e.y + 4, e.w + 12, 96));
    lista.push(rect(s.personaje.x - 40, s.personaje.y - 34, 80, 70));
  }
  lista.push(rect(SILLON.x, SILLON.y - 20, SILLON.w, SILLON.h + 20), rect(BEBEDERO.x, BEBEDERO.y + 30, BEBEDERO.w, 55));
  lista.push(rect(1250, 1045, 300, 60)); // recepción
  lista.push(rect(1080 - 56, 1072 - 24, 112, 48)); // mesa baja del lobby
  lista.push(MESA_PAPELERIA, ESTANTE_PAPELERIA);
  for (const o of OBJETOS_SALA) lista.push(rect(o.x, o.y + o.h - 45, o.w, 45));
  for (const p of PLANTAS) lista.push(rect(p.x - 16, p.y - 16, 32, 32));
  lista.push(...obstaculosDeMuebles());
  return lista;
}

/** ¿Un círculo de radio `r` en (x, z) toca este rectángulo? */
export function tocaRect(x: number, z: number, r: number, c: Rect): boolean {
  const cx = Math.max(c.x, Math.min(x, c.x + c.w));
  const cz = Math.max(c.y, Math.min(z, c.y + c.h));
  return (x - cx) ** 2 + (z - cz) ** 2 < r * r;
}

/** Cuánto se mete un círculo de radio `r` en (x, z) dentro de un rectángulo (0 si no lo toca). */
export function penetracion(x: number, z: number, r: number, c: Rect): number {
  const cx = Math.max(c.x, Math.min(x, c.x + c.w));
  const cz = Math.max(c.y, Math.min(z, c.y + c.h));
  return Math.max(0, r - Math.hypot(x - cx, z - cz));
}

const ADENTRO: Rect = rect(60 - 22 + 4, 60 - 22 + 4, MUNDO.ancho - 120 + 44 - 8, MUNDO.alto - 120 + 44 - 8);

/** Mueve a la persona durante `dt` segundos. Choca con las paredes y los muebles, pero se desliza por ellos en vez de frenarse. */
export function moverJugador(j: Jugador, e: Entrada, dt: number, paredes: readonly Rect[] = obstaculos()): Jugador {
  const largo = Math.hypot(e.adelante, e.lateral);
  if (largo === 0 || dt <= 0) return j;
  const paso = ((e.correr ? CORRER : CAMINAR) * dt) / Math.max(1, largo);
  const adelante = { x: -Math.sin(j.yaw), z: -Math.cos(j.yaw) };
  const derecha = { x: Math.cos(j.yaw), z: -Math.sin(j.yaw) };
  const dx = (adelante.x * e.adelante + derecha.x * e.lateral) * paso;
  const dz = (adelante.z * e.adelante + derecha.z * e.lateral) * paso;
  const adentro = (x: number, z: number) => x > ADENTRO.x && z > ADENTRO.y && x < ADENTRO.x + ADENTRO.w && z < ADENTRO.y + ADENTRO.h;
  // si ya estaba tocando algo, puede moverse mientras se aleje: así nunca queda atrapada
  const empotrado = (x: number, z: number) => Math.max(0, ...paredes.map((c) => penetracion(x, z, RADIO_JUGADOR, c)));
  const antes = empotrado(j.x, j.z);
  const libre = (x: number, z: number) => adentro(x, z) && empotrado(x, z) <= antes;
  let { x, z } = j;
  if (libre(x + dx, z)) x += dx;
  if (libre(x, z + dz)) z += dz;
  return { ...j, x, z };
}

/** Mira con el mouse: `dx` y `dy` en píxeles. No deja dar vueltas de campana hacia arriba ni hacia abajo. */
export function girarJugador(j: Jugador, dx: number, dy: number, sensibilidad = 0.0024): Jugador {
  return { ...j, yaw: j.yaw - dx * sensibilidad, pitch: Math.max(-1.2, Math.min(1.2, j.pitch - dy * sensibilidad)) };
}

/** Aparece adentro de una oficina, un poco después de su puerta y mirando hacia adentro. */
export function entradaDeSala(sala: Sala): Jugador {
  const a = sala.area;
  if (sala.tipo === "vidrio") return { x: a.x + 80, z: a.y + a.h / 2, yaw: -Math.PI / 2, pitch: 0 };
  const cx = a.x + a.w / 2;
  return a.y < LOBBY.y ? { x: cx, z: a.y + a.h - 38, yaw: 0, pitch: 0 } : { x: cx, z: a.y + 60, yaw: Math.PI, pitch: 0 };
}

/** La sala donde está parada la persona, o `null` si está en el lobby o en un pasillo. */
export function salaDe(j: Jugador): number | null {
  const i = SALAS.findIndex((s) => j.x >= s.area.x && j.x <= s.area.x + s.area.w && j.z >= s.area.y && j.z <= s.area.y + s.area.h);
  return i === -1 ? null : i;
}

export type Candidato = { elemento: Elemento; x: number; z: number };

/** Con qué se puede interactuar ahora: cada agente, el documento de los que terminaron y la papelería. */
export function candidatos(terminados: readonly boolean[]): Candidato[] {
  const lista: Candidato[] = SALAS.map((s, i) => ({ elemento: { tipo: "agente", indice: i }, x: s.personaje.x, z: s.personaje.y }));
  SALAS.forEach((s, i) => {
    if (!terminados[i]) return;
    const d = rectDocumento(s);
    lista.push({ elemento: { tipo: "documento", indice: i }, x: d.x + d.w / 2, z: d.y + d.h / 2 });
  });
  lista.push({ elemento: { tipo: "papeleria" }, x: MESA_PAPELERIA.x + MESA_PAPELERIA.w / 2, z: MESA_PAPELERIA.y + MESA_PAPELERIA.h / 2 });
  return lista;
}

/** Lo que tiene la persona adelante, cerca y a la vista: lo más conveniente para tocar con «E». */
export function objetivoDeInteraccion(j: Jugador, terminados: readonly boolean[]): Elemento | null {
  const mira = { x: -Math.sin(j.yaw), z: -Math.cos(j.yaw) };
  let mejor: { elemento: Elemento; puntaje: number } | null = null;
  for (const c of candidatos(terminados)) {
    const dx = c.x - j.x;
    const dz = c.z - j.z;
    const distancia = Math.hypot(dx, dz);
    if (distancia > ALCANCE || distancia === 0) continue;
    const angulo = Math.acos(Math.max(-1, Math.min(1, (dx * mira.x + dz * mira.z) / distancia)));
    if (angulo > ANGULO_MAXIMO) continue;
    const puntaje = distancia + angulo * 140;
    if (!mejor || puntaje < mejor.puntaje) mejor = { elemento: c.elemento, puntaje };
  }
  return mejor?.elemento ?? null;
}
