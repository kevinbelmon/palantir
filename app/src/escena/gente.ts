import * as THREE from "three";
import { parpadeo, PERSONAS_AMBIENTE, poseDe, respiracion, type PersonaAmbiente, type Pose } from "../oficina";
import { plastico } from "./bloques3d";
import { ANCLAS, crearMunyeco, type Munyeco } from "./figuras";

/** Cómo mueve el cuerpo una persona según lo que hace. Funciona igual para los agentes sentados, los colegas y la gente de pie. */
export type Gesto = "quieto" | "teclea" | "charla" | "escribe" | "lee" | "consulta" | "camina" | "habla-sentado";

export type Gente = {
  /** Mueve a todos al segundo `t` (0 los deja quietos). */
  actualizar: (t: number) => void;
  /** Dónde está cada persona de pie ahora, para que no se pueda atravesar a nadie. */
  posiciones: () => { x: number; z: number }[];
  liberar: () => void;
};

/** Anima el cuerpo de un muñeco: cada gesto es una combinación de brazos, cabeza, torso y piernas. `fase` desfasa a cada persona. */
export function animarCuerpo(m: Munyeco, gesto: Gesto, t: number, fase: number, indice: number, lleva = false): void {
  const r = respiracion(t, indice);
  m.torso.position.y = ANCLAS.torsoY + r * 0.5;
  m.cabeza.position.y = ANCLAS.cabezaY + r;
  m.brazoI.position.y = m.brazoD.position.y = ANCLAS.hombroY + r * 0.5;
  m.brazoI.rotation.set(0, 0, 0);
  m.brazoD.rotation.set(0, 0, 0);
  m.cabeza.rotation.set(0, 0, 0);
  m.torso.rotation.set(0, 0, 0);
  for (const p of m.piernas) {
    p.cadera.rotation.x = 0;
    p.rodilla.rotation.x = 0;
  }
  m.grupo.position.y = 0;

  switch (gesto) {
    case "teclea": {
      // manos sobre el teclado, mirando la pantalla y moviendo los dedos
      const d = Math.sin(t * 13 + fase) * 0.2;
      m.brazoI.rotation.x = -0.7 + d;
      m.brazoD.rotation.x = -0.7 - d;
      m.cabeza.rotation.x = 0.12 + Math.sin(t * 0.7 + fase) * 0.04;
      m.cabeza.rotation.y = Math.sin(t * 0.35 + fase) * 0.1;
      m.torso.rotation.x = 0.05;
      break;
    }
    case "charla": {
      // charla con una taza en la mano: cuando habla la sostiene al costado y mueve la otra mano; cuando escucha, toma un sorbo y asiente
      const habla = Math.sin(t * 0.8 + fase) > 0;
      const sorbo = habla ? 0 : Math.max(0, Math.sin(t * 1.6 + fase * 2));
      m.brazoD.rotation.x = -0.75 - sorbo * 0.75;
      m.brazoI.rotation.x = habla ? -0.45 + Math.sin(t * 3 + fase) * 0.3 : -0.15;
      m.brazoI.rotation.z = habla ? 0.12 : 0;
      m.cabeza.rotation.x = habla ? Math.sin(t * 2.4 + fase) * 0.05 : 0.04 + sorbo * 0.12 + Math.max(0, Math.sin(t * 3.1 + fase)) * 0.08;
      m.cabeza.rotation.y = Math.sin(t * 0.5 + fase) * 0.08;
      break;
    }
    case "habla-sentado": {
      // colegas en una reunión: se miran, asienten y mueven las manos
      const habla = Math.sin(t * 0.7 + fase) > 0.2;
      m.brazoD.rotation.x = habla ? -0.9 + Math.sin(t * 3 + fase) * 0.3 : -0.55;
      m.brazoI.rotation.x = -0.55;
      m.cabeza.rotation.x = Math.sin(t * 1.9 + fase) * 0.05;
      m.cabeza.rotation.y = Math.sin(t * 0.45 + fase) * 0.25;
      break;
    }
    case "escribe": {
      // ordena y firma papeles sobre la mesa
      m.brazoD.rotation.x = -0.95 + Math.sin(t * 6 + fase) * 0.06;
      m.brazoD.rotation.z = Math.sin(t * 1.7 + fase) * 0.12;
      m.brazoI.rotation.x = -0.8;
      m.cabeza.rotation.x = 0.38;
      m.torso.rotation.x = 0.1;
      break;
    }
    case "lee": {
      // sostiene un libro con las dos manos y mira hacia abajo; de vez en cuando pasa la hoja
      const hoja = Math.max(0, Math.sin(t * 0.45 + fase) - 0.92) * 6;
      m.brazoI.rotation.x = -1.2;
      m.brazoD.rotation.x = -1.2 - hoja * 0.15;
      m.brazoI.rotation.z = -0.1;
      m.brazoD.rotation.z = 0.1 - hoja * 0.2;
      m.cabeza.rotation.x = 0.36;
      m.cabeza.rotation.y = Math.sin(t * 0.3 + fase) * 0.08;
      break;
    }
    case "consulta": {
      // mira una carpeta que sostiene con una mano y la repasa con la otra
      m.brazoI.rotation.x = -1.15;
      m.brazoI.rotation.z = -0.15;
      m.brazoD.rotation.x = -0.95 + Math.sin(t * 1.3 + fase) * 0.12;
      m.brazoD.rotation.z = 0.2;
      m.cabeza.rotation.x = 0.3 + Math.sin(t * 0.8 + fase) * 0.04;
      m.cabeza.rotation.y = Math.sin(t * 0.4 + fase) * 0.1;
      m.torso.rotation.x = 0.05;
      break;
    }
    case "camina": {
      const w = t * 7 + fase;
      const [pi, pd] = m.piernas;
      if (pi && pd) {
        pi.cadera.rotation.x = Math.sin(w) * 0.6;
        pd.cadera.rotation.x = -Math.sin(w) * 0.6;
        pi.rodilla.rotation.x = 0.1 + Math.max(0, Math.cos(w)) * 0.9;
        pd.rodilla.rotation.x = 0.1 + Math.max(0, -Math.cos(w)) * 0.9;
      }
      // con la carpeta bajo el brazo, ese brazo no se balancea
      m.brazoI.rotation.x = lleva ? -0.55 : -Math.sin(w) * 0.55;
      m.brazoD.rotation.x = Math.sin(w) * 0.55;
      m.brazoI.rotation.z = 0.06;
      m.brazoD.rotation.z = -0.06;
      m.grupo.position.y = Math.abs(Math.cos(w)) * 1.8;
      m.torso.rotation.y = Math.sin(w) * 0.06;
      m.cabeza.rotation.y = Math.sin(t * 0.9 + fase) * 0.25;
      break;
    }
    case "quieto": {
      m.brazoI.rotation.x = -0.1;
      m.brazoD.rotation.x = -0.1;
      m.cabeza.rotation.y = Math.sin(t * 0.5 + fase) * 0.3;
      break;
    }
  }
  m.cara.material.map = parpadeo(t, indice) ? m.cerrados : m.abiertos;
}

/** Un libro abierto entre las dos manos de quien lee (las manos quedan a ±18 del centro y unos 50 adelante). */
function crearLibro(): THREE.Mesh {
  const libro = new THREE.Mesh(new THREE.BoxGeometry(34, 24, 2.6), plastico("#8a3b3b", { roughness: 0.6 }));
  libro.position.set(0, 99, 49);
  libro.rotation.x = -0.25;
  libro.castShadow = true;
  return libro;
}

/** Una carpeta de papeles que cuelga de la mano: sirve en cualquier postura del brazo. */
function crearCarpeta(indice: number): THREE.Mesh {
  const colores = ["#c9a25a", "#5b8cff", "#d9d2c4", "#3ecf6e"];
  const carpeta = new THREE.Mesh(new THREE.BoxGeometry(2.4, 15, 21), plastico(colores[indice % colores.length], { roughness: 0.55 }));
  carpeta.position.set(0, -5, 6);
  carpeta.castShadow = true;
  return carpeta;
}

/** Una taza que no se acuesta: gira al revés que el brazo, así siempre queda parada. */
function crearTaza(): THREE.Mesh {
  const taza = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3, 7.5, 14), plastico("#f4eee0", { roughness: 0.35 }));
  taza.position.set(0, -1.5, 4);
  taza.castShadow = true;
  return taza;
}

const gestoDe = (p: PersonaAmbiente, pose: Pose): Gesto => (pose.caminando ? "camina" : p.modo === "camina" ? (pose.hace ?? "consulta") : p.actividad);

/** Crea a toda la gente de ambiente (recepcionista, empleados que caminan, colegas, lectores) y devuelve cómo animarla. */
export function crearGente(raiz: THREE.Group): Gente {
  const gente = PERSONAS_AMBIENTE.map((p) => {
    const m = crearMunyeco(p.indice, !(p.modo === "quieta" && p.sentada));
    // cada uno lleva lo que usa: los que caminan, una carpeta; los que charlan, una taza; los que leen, un libro
    if (p.modo === "quieta" && p.actividad === "lee") m.grupo.add(crearLibro());
    if (p.modo === "camina") m.manoI.add(crearCarpeta(p.indice));
    const taza = p.modo === "quieta" && p.actividad === "charla" ? crearTaza() : null;
    if (taza) m.manoD.add(taza);
    raiz.add(m.grupo);
    return { p, m, taza, pose: poseDe(p, 0) };
  });

  function actualizar(t: number) {
    for (const g of gente) {
      g.pose = poseDe(g.p, t);
      g.m.grupo.position.set(g.pose.x, 0, g.pose.z);
      g.m.grupo.rotation.y = g.pose.giro;
      animarCuerpo(g.m, gestoDe(g.p, g.pose), t, g.p.modo === "quieta" ? g.p.fase : g.p.desfase, g.p.indice, g.p.modo === "camina");
      if (g.taza) g.taza.rotation.x = 0.5 - g.m.brazoD.rotation.x;
    }
  }

  return {
    actualizar,
    posiciones: () => gente.filter((g) => !(g.p.modo === "quieta" && g.p.sentada)).map((g) => ({ x: g.pose.x, z: g.pose.z })),
    liberar: () => {
      for (const g of gente) {
        g.m.abiertos.dispose();
        g.m.cerrados.dispose();
      }
    },
  };
}
