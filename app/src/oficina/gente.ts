// La gente que trabaja en la casa además de los ocho agentes: recepcionista, empleados que recorren los pasillos
// y visitan oficinas, dos colegas charlando junto al bebedero, lectores en los sillones y alguien en la papelería.
// Acá solo hay lógica (dónde está cada uno y qué hace en cada instante); el dibujo está en `escena/gente.ts`.

/** Un lugar del circuito: se queda `pausa` segundos y sigue. `mira` (giro sobre Y: 0 mira al sur, π al norte) es hacia dónde mira mientras espera. */
export type Parada = { x: number; z: number; pausa: number; mira?: number; hace?: Actividad };

/** Lo que hace una persona: teclear, charlar tomando café, escribir papeles, leer un libro o consultar su carpeta. */
export type Actividad = "teclea" | "charla" | "escribe" | "lee" | "consulta";

export type PersonaAmbiente =
  | { id: string; indice: number; modo: "camina"; circuito: readonly Parada[]; velocidad: number; desfase: number }
  | { id: string; indice: number; modo: "quieta"; x: number; z: number; giro: number; actividad: Actividad; sentada: boolean; fase: number };

/** Dónde está una persona y hacia dónde mira, en un instante. `giro` es el giro sobre Y de su cuerpo (un muñeco mira a +z con giro 0). */
export type Pose = { x: number; z: number; giro: number; caminando: boolean; hace?: Actividad };

const parada = (x: number, z: number, pausa: number, mira?: number, hace?: Actividad): Parada => ({ x, z, pausa, mira, hace });

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
    if (resto < p.pausa) return { x: p.x, z: p.z, giro: p.mira ?? giro, caminando: false, hace: p.hace };
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

/**
 * Los cuatro que recorren la casa llevan una carpeta bajo el brazo y, cuando se detienen, la consultan o
 * escriben. Dos entran a una oficina y miran al agente de frente; uno va a la papelería a escribir sobre la mesa.
 * Ninguno se queda esperando en la punta de un pasillo: las pausas son cortas y siempre con algo en la mano.
 */
export const PERSONAS_AMBIENTE: readonly PersonaAmbiente[] = [
  // recepción: quien atiende, parada detrás del mostrador de piedra, mirando el atrio
  { id: "recepcion", indice: 1, modo: "quieta", x: 1630, z: 1590, giro: N, actividad: "teclea", sentada: false, fase: 0.4 },
  // dos colegas junto al bebedero, enfrentados a 80 de distancia, con la taza siempre en la mano
  { id: "charla-a", indice: 5, modo: "quieta", x: 2640, z: 1420, giro: 0, actividad: "charla", sentada: false, fase: 0 },
  { id: "charla-b", indice: 2, modo: "quieta", x: 2640, z: 1500, giro: N, actividad: "charla", sentada: false, fase: 2.1 },
  // lectores en los dos sillones del lobby, cada uno de cara a su mesa ratona
  { id: "lector-este", indice: 6, modo: "quieta", x: 2708, z: 1200, giro: -N / 2, actividad: "lee", sentada: true, fase: 1.3 },
  { id: "lector-oeste", indice: 0, modo: "quieta", x: 836, z: 1240, giro: N / 2, actividad: "lee", sentada: true, fase: 3.2 },
  // alguien ordenando papeles en la mesa de la papelería, de cara a la mesa
  { id: "papeleria", indice: 3, modo: "quieta", x: 440, z: 1500, giro: N, actividad: "escribe", sentada: false, fase: 0.9 },
  // pasillo de arriba: va y viene, y entra a la oficina 3 a consultar algo mirando al agente
  {
    id: "pasillo-norte",
    indice: 2,
    modo: "camina",
    velocidad: 88,
    desfase: 0,
    circuito: [parada(200, 910, 0.5), parada(2310, 910, 0.5), parada(2310, 730, 7, N, "consulta"), parada(2310, 910, 0.5), parada(3500, 910, 0.5)],
  },
  // pasillo de abajo: lo mismo, entrando a la oficina 6
  {
    id: "pasillo-sur",
    indice: 4,
    modo: "camina",
    velocidad: 82,
    desfase: 31,
    circuito: [parada(250, 1750, 0.5), parada(1430, 1750, 0.5), parada(1430, 1960, 7, 0, "consulta"), parada(1430, 1750, 0.5), parada(2600, 1750, 0.5)],
  },
  // lobby: da la vuelta al cartel del piso, consultando la carpeta junto a las columnas
  {
    id: "lobby",
    indice: 7,
    modo: "camina",
    velocidad: 80,
    desfase: 12,
    circuito: [parada(900, 1150, 3, undefined, "consulta"), parada(1250, 1150, 0.5), parada(1250, 1370, 0.5), parada(1750, 1370, 3, undefined, "consulta"), parada(2350, 1370, 0.5), parada(2350, 1150, 3, undefined, "consulta")],
  },
  // va a la papelería a escribir sobre la mesa y vuelve al pasillo
  {
    id: "papeleria-ida",
    indice: 5,
    modo: "camina",
    velocidad: 84,
    desfase: 55,
    circuito: [parada(450, 910, 0.5), parada(450, 1290, 6, 0, "escribe"), parada(450, 910, 0.5), parada(950, 910, 0.5)],
  },
];
