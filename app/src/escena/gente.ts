import * as THREE from "three";
import { parpadeo, PERSONAS_AMBIENTE, poseDe, respiracion, type PersonaAmbiente, type Pose } from "../oficina";
import { plastico } from "./bloques3d";
import { ANCLAS, crearMunyeco, type Munyeco } from "./figuras";

/** Cómo mueve el cuerpo una persona según lo que hace. Funciona igual para los agentes sentados, los colegas y la gente de pie. */
export type Gesto = "quieto" | "teclea" | "charla" | "escribe" | "lee" | "camina" | "habla-sentado";

export type Gente = {
  /** Mueve a todos al segundo `t` (0 los deja quietos). */
  actualizar: (t: number) => void;
  /** Dónde está cada persona de pie ahora, para que no se pueda atravesar a nadie. */
  posiciones: () => { x: number; z: number }[];
  liberar: () => void;
};

/** Anima el cuerpo de un muñeco: cada gesto es una combinación de brazos, cabeza, torso y piernas. `fase` desfasa a cada persona. */
export function animarCuerpo(m: Munyeco, gesto: Gesto, t: number, fase: number, indice: number): void {
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
      // gesticula con una mano, asiente y gira la cabeza hacia quien le habla
      const habla = Math.sin(t * 0.8 + fase) > 0;
      m.brazoD.rotation.x = habla ? -1.0 + Math.sin(t * 3.4 + fase) * 0.35 : -0.25;
      m.brazoD.rotation.z = habla ? 0.25 + Math.sin(t * 2.6 + fase) * 0.12 : 0;
      m.brazoI.rotation.x = habla ? -0.3 + Math.sin(t * 2.1 + fase) * 0.1 : -0.55;
      m.cabeza.rotation.x = habla ? Math.sin(t * 2.4 + fase) * 0.05 : 0.04 + Math.max(0, Math.sin(t * 3.1 + fase)) * 0.14;
      m.cabeza.rotation.y = Math.sin(t * 0.5 + fase) * 0.12;
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
      m.brazoI.rotation.x = -1.25;
      m.brazoD.rotation.x = -1.25 - hoja * 0.15;
      m.brazoD.rotation.z = -hoja * 0.2;
      m.cabeza.rotation.x = 0.4;
      m.cabeza.rotation.y = Math.sin(t * 0.3 + fase) * 0.08;
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
      m.brazoI.rotation.x = -Math.sin(w) * 0.55;
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

function crearLibro(): THREE.Mesh {
  const libro = new THREE.Mesh(new THREE.BoxGeometry(17, 2.4, 12.5), plastico("#8a3b3b", { roughness: 0.6 }));
  libro.position.set(0, 88, 15);
  libro.rotation.x = -0.45;
  libro.castShadow = true;
  return libro;
}

const gestoDe = (p: PersonaAmbiente, pose: Pose): Gesto => (pose.caminando ? "camina" : p.modo === "camina" ? "quieto" : p.actividad);

/** Crea a toda la gente de ambiente (recepcionista, empleados que caminan, colegas, lectores) y devuelve cómo animarla. */
export function crearGente(raiz: THREE.Group): Gente {
  const gente = PERSONAS_AMBIENTE.map((p) => {
    const m = crearMunyeco(p.indice, !(p.modo === "quieta" && p.sentada));
    if (p.modo === "quieta" && p.actividad === "lee") m.grupo.add(crearLibro());
    raiz.add(m.grupo);
    return { p, m, pose: poseDe(p, 0) };
  });

  function actualizar(t: number) {
    for (const g of gente) {
      g.pose = poseDe(g.p, t);
      g.m.grupo.position.set(g.pose.x, 0, g.pose.z);
      g.m.grupo.rotation.y = g.pose.giro;
      animarCuerpo(g.m, gestoDe(g.p, g.pose), t, g.p.modo === "quieta" ? g.p.fase : g.p.desfase, g.p.indice);
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
