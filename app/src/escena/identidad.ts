import { LOBBY, type Rect, type Sala } from "../oficina";
import { MESA_REDONDA_REVIEW } from "../oficina/decoracion";

/** El color que identifica a cada agente: su camisa, su cartel, su alfombra y el marco de su puerta. */
export const COLORES_SALA = ["#5b8cff", "#8e6bff", "#3ecf6e", "#f2a33a", "#ff6b81", "#2ec4b6", "#e3b72a", "#7d82b8"] as const;

const GROSOR = 16;
const HUECO = 130;
/** Alto del marco de la puerta. */
export const ALTO_MARCO = 165;

const aNumeros = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** Mezcla dos colores `#rrggbb`: `k` = 0 da el primero y `k` = 1 el segundo. */
export function mezclarHex(a: string, b: string, k: number): string {
  const [ra, ga, ba] = aNumeros(a);
  const [rb, gb, bb] = aNumeros(b);
  const m = (x: number, y: number) =>
    Math.round(x + (y - x) * k)
      .toString(16)
      .padStart(2, "0");
  return `#${m(ra, rb)}${m(ga, gb)}${m(ba, bb)}`;
}

/** El piso de cada sala lleva un toque del color de su agente, para que cada oficina se vea propia. */
export function colorDePiso(indice: number): string {
  return mezclarHex("#8a8a8a", COLORES_SALA[indice], 0.22);
}

/** El marco de la puerta de la sala: dos postes y un dintel, justo sobre el hueco que dejan las paredes. */
export function marcoDePuerta(sala: Sala): { postes: [Rect, Rect]; dintel: Rect } {
  const a = sala.area;
  if (sala.tipo === "vidrio") {
    const cz = a.y + a.h / 2;
    const x = a.x - GROSOR / 2;
    return {
      postes: [
        { x, y: cz - HUECO / 2 - GROSOR, w: GROSOR, h: GROSOR },
        { x, y: cz + HUECO / 2, w: GROSOR, h: GROSOR },
      ],
      dintel: { x, y: cz - HUECO / 2 - GROSOR, w: GROSOR, h: HUECO + GROSOR * 2 },
    };
  }
  const y = a.y < LOBBY.y ? a.y + a.h - GROSOR / 2 : a.y - GROSOR / 2;
  const cx = a.x + a.w / 2;
  return {
    postes: [
      { x: cx - HUECO / 2 - GROSOR, y, w: GROSOR, h: GROSOR },
      { x: cx + HUECO / 2, y, w: GROSOR, h: GROSOR },
    ],
    dintel: { x: cx - HUECO / 2 - GROSOR, y, w: HUECO + GROSOR * 2, h: GROSOR },
  };
}

/** La placa con el nombre de la oficina, al lado de su puerta y del lado de afuera. `giroY` hace que mire hacia el pasillo. */
export function placaDePuerta(sala: Sala): { x: number; z: number; giroY: number; altura: number } {
  const a = sala.area;
  const afuera = GROSOR / 2 + 0.6;
  const lado = HUECO / 2 + GROSOR + 40;
  if (sala.tipo === "vidrio") return { x: a.x - afuera, z: a.y + a.h / 2 - lado, giroY: -Math.PI / 2, altura: 130 };
  const cx = a.x + a.w / 2;
  return a.y < LOBBY.y ? { x: cx + lado, z: a.y + a.h + afuera, giroY: 0, altura: 130 } : { x: cx - lado, z: a.y - afuera, giroY: Math.PI, altura: 130 };
}

/** La alfombra de la oficina: debajo del escritorio y la silla (o de la mesa de reuniones). */
export function alfombraDeSala(sala: Sala): Rect {
  if (sala.tipo === "vidrio") {
    const m = MESA_REDONDA_REVIEW;
    return { x: m.x - 210, y: m.y - 150, w: 420, h: 300 };
  }
  const e = sala.escritorio;
  const arriba = sala.personaje.y - 80;
  return { x: e.x - 30, y: arriba, w: e.w + 60, h: e.y + e.h + 40 - arriba };
}

/** La ventana sobre la pared del fondo: `x` y `w` en el plano, `base` y `alto` en altura. */
export function ventanaDeSala(sala: Sala): { x: number; w: number; base: number; alto: number } {
  const a = sala.area;
  return sala.tipo === "vidrio" ? { x: a.x + 430, w: 110, base: 70, alto: 80 } : { x: a.x + 50, w: 130, base: 70, alto: 80 };
}

/** El reloj de pared: su posición `x` en el plano y su altura. */
export function relojDeSala(sala: Sala): { x: number; altura: number; radio: number } {
  const a = sala.area;
  return { x: sala.tipo === "vidrio" ? a.x + 70 : a.x + 235, altura: 138, radio: 17 };
}
