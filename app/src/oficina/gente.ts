import { PAPELERIA } from "./mundo";

// La gente que trabaja en la casa además de los ocho agentes: recepcionista, empleados que recorren los pasillos
// y visitan oficinas, dos colegas charlando junto al bebedero, lectores en los sillones y alguien en la papelería.
// Acá solo hay lógica (dónde está cada uno y qué hace en cada instante); el dibujo está en `escena/gente.ts`.

/** Un lugar del circuito: se queda `pausa` segundos y sigue. `mira` (giro sobre Y: 0 mira al sur, π al norte) es hacia dónde mira mientras espera. */
export type Parada = { x: number; z: number; pausa: number; mira?: number };

export type Actividad = "teclea" | "charla" | "escribe" | "lee";

export type PersonaAmbiente =
  | { id: string; indice: number; modo: "camina"; circuito: readonly Parada[]; velocidad: number; desfase: number }
  | { id: string; indice: number; modo: "quieta"; x: number; z: number; giro: number; actividad: Actividad; sentada: boolean; fase: number };

/** Dónde está una persona y hacia dónde mira, en un instante. `giro` es el giro sobre Y de su cuerpo (un muñeco mira a +z con giro 0). */
export type Pose = { x: number; z: number; giro: number; caminando: boolean };

const parada = (x: number, z: number, pausa: number, mira?: number): Parada => ({ x, z, pausa, mira });

/** Hacia dónde mira quien va de (ax, az) a (bx, bz). */
const rumbo = (ax: number, az: number, bx: number, bz: number) => Math.atan2(bx - ax, bz - az);

export function duracionDeCircuito(circuito: readonly Parada[], velocidad: number): number {
  let total = 0;
  circuito.forEach((p, i) => {
    const q = circuito[(i + 1) % circuito.length];
    total += p.pausa + Math.hypot(q.x - p.x, q.z - p.z) / velocidad;
  });
  return total;
}

/** Dónde está quien recorre el circuito en el segundo `t`: espera en cada parada y camina en línea recta a la siguiente, para siempre. */
export function poseDeCircuito(circuito: readonly Parada[], velocidad: number, t: number): Pose {
  const ciclo = duracionDeCircuito(circuito, velocidad);
  let resto = ((t % ciclo) + ciclo) % ciclo;
  for (let i = 0; i < circuito.length; i++) {
    const p = circuito[i];
    const q = circuito[(i + 1) % circuito.length];
    const largo = Math.hypot(q.x - p.x, q.z - p.z);
    const giro = largo === 0 ? (p.mira ?? 0) : rumbo(p.x, p.z, q.x, q.z);
    if (resto < p.pausa) return { x: p.x, z: p.z, giro: p.mira ?? giro, caminando: false };
    resto -= p.pausa;
    const camino = largo / velocidad;
    if (resto < camino) {
      const k = largo === 0 ? 0 : resto / camino;
      return { x: p.x + (q.x - p.x) * k, z: p.z + (q.z - p.z) * k, giro, caminando: true };
    }
    resto -= camino;
  }
  const u = circuito[circuito.length - 1];
  return { x: u.x, z: u.z, giro: u.mira ?? 0, caminando: false };
}

export function poseDe(p: PersonaAmbiente, t: number): Pose {
  return p.modo === "camina" ? poseDeCircuito(p.circuito, p.velocidad, t + p.desfase) : { x: p.x, z: p.z, giro: p.giro, caminando: false };
}

const N = Math.PI;

export const PERSONAS_AMBIENTE: readonly PersonaAmbiente[] = [
  // recepción: quien atiende, de pie del lado del fondo del mostrador, mirando al lobby
  { id: "recepcion", indice: 1, modo: "quieta", x: 1330, z: 1128, giro: N, actividad: "teclea", sentada: false, fase: 0.4 },
  // dos colegas charlando junto al bebedero
  { id: "charla-a", indice: 5, modo: "quieta", x: 1620, z: 800, giro: N / 2, actividad: "charla", sentada: false, fase: 0 },
  { id: "charla-b", indice: 2, modo: "quieta", x: 1676, z: 800, giro: -N / 2, actividad: "charla", sentada: false, fase: 2.1 },
  // lectores en los dos sillones del lobby (el muñeco se sienta de cara a la mesa ratona)
  { id: "lector-este", indice: 6, modo: "quieta", x: 1774, z: 925, giro: -N / 2, actividad: "lee", sentada: true, fase: 1.3 },
  { id: "lector-oeste", indice: 0, modo: "quieta", x: 646, z: 905, giro: N / 2, actividad: "lee", sentada: true, fase: 3.2 },
  // alguien ordenando papeles en la mesa de la papelería, del lado de la puerta
  { id: "papeleria", indice: 3, modo: "quieta", x: PAPELERIA.x + 210, z: PAPELERIA.y + 350, giro: N, actividad: "escribe", sentada: false, fase: 0.9 },
  // pasillo de arriba: va y viene, y a veces entra a la oficina 3 a consultar algo
  {
    id: "pasillo-norte",
    indice: 2,
    modo: "camina",
    velocidad: 78,
    desfase: 0,
    circuito: [parada(200, 590, 2), parada(1580, 590, 0.4), parada(1580, 490, 7, N), parada(1580, 590, 0.4), parada(2300, 590, 2)],
  },
  // pasillo de abajo: lo mismo con la oficina 6
  {
    id: "pasillo-sur",
    indice: 4,
    modo: "camina",
    velocidad: 72,
    desfase: 31,
    circuito: [parada(250, 1190, 2), parada(980, 1190, 0.4), parada(980, 1330, 7, 0), parada(980, 1190, 0.4), parada(1800, 1190, 2)],
  },
  // lobby: da la vuelta al cartel mirando el piso de mármol
  {
    id: "lobby",
    indice: 7,
    modo: "camina",
    velocidad: 70,
    desfase: 12,
    circuito: [parada(860, 770, 2.5), parada(1560, 770, 0.5), parada(1580, 990, 4), parada(880, 990, 3)],
  },
  // va a la papelería a dejar y buscar papeles y vuelve al pasillo
  {
    id: "papeleria-ida",
    indice: 5,
    modo: "camina",
    velocidad: 74,
    desfase: 55,
    circuito: [parada(310, 590, 1.5), parada(310, 850, 6, 0), parada(310, 590, 0.5), parada(900, 590, 2)],
  },
];
