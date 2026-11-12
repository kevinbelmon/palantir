import * as THREE from "three";
import type { Rect } from "../oficina";
import type { TipoObjeto } from "../oficina/decoracion";
import { APARIENCIAS, PALETA } from "../oficina/paleta";
import { plastico } from "./bloques3d";
import { mezclarHex } from "./identidad";
import { conRepeticion, texturaCaraReal, texturaMadera } from "./materiales";
import { texturaPantalla } from "./texturas";

const PANTALON = "#2c3042";
const CALZADO = "#2a211c";
const GRIS_APAGADO = "#8b8fb0";
const PIELES = ["#f0c6a0", "#dfae86", "#c68b61", "#8f5d3d", "#f3d3b6", "#d6a278", "#a86f4a", "#6e4630"];
const IRIS = ["#4a7bb0", "#5a3b25", "#3f7a52", "#6b4a2a", "#4a7bb0", "#2f2a28", "#6a8a5a", "#5a3b25"];

/** Dónde quedan las articulaciones del cuerpo (la animación las usa para respirar, teclear y saludar). */
export const ANCLAS = { torsoY: 78, cabezaY: 125, hombroY: 104, hombroX: 18.5 } as const;

type Pieza = { malla: THREE.Mesh; normal: THREE.Material; apagado: THREE.Material };

export type Munyeco = {
  grupo: THREE.Group;
  torso: THREE.Mesh;
  cabeza: THREE.Group;
  brazoI: THREE.Group;
  brazoD: THREE.Group;
  /** Dónde está cada mano: lo que lleva una persona (un libro, una carpeta) se cuelga de acá y la sigue. */
  manoI: THREE.Group;
  manoD: THREE.Group;
  /** Las piernas articuladas (cadera y rodilla) de la persona de pie; vacío si está sentada. */
  piernas: { cadera: THREE.Group; rodilla: THREE.Group }[];
  cara: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  abiertos: THREE.Texture;
  cerrados: THREE.Texture;
  piezas: Pieza[];
};

/** Una persona con proporciones reales: cabeza, cuello, torso, brazos con codo y mano, piernas y zapatos. Sentada por defecto, o de pie con las piernas articuladas para caminar. Mira hacia +z. */
export function crearMunyeco(indice: number, dePie = false): Munyeco {
  const a = APARIENCIAS[indice % APARIENCIAS.length];
  const piel = PIELES[indice % PIELES.length];
  const grupo = new THREE.Group();
  const piezas: Pieza[] = [];

  const pieza = (geo: THREE.BufferGeometry, color: string, x: number, y: number, z: number, padre: THREE.Object3D = grupo, rugosidad = 0.62) => {
    const normal = new THREE.MeshStandardMaterial({ color, roughness: rugosidad });
    const apagado = new THREE.MeshStandardMaterial({ color: mezclarHex(color, GRIS_APAGADO, 0.55), roughness: rugosidad });
    const malla = new THREE.Mesh(geo, normal);
    malla.position.set(x, y, z);
    malla.castShadow = true;
    malla.receiveShadow = true;
    padre.add(malla);
    piezas.push({ malla, normal, apagado });
    return malla;
  };
  const acostada = (m: THREE.Mesh) => ((m.rotation.x = Math.PI / 2), m);

  // piernas: sentada (muslos hacia adelante, canillas hacia abajo) o de pie (cadera y rodilla que se mueven)
  const piernas: Munyeco["piernas"] = [];
  pieza(new THREE.SphereGeometry(14.5, 20, 14), PANTALON, 0, dePie ? 53 : 50, 0).scale.set(1.15, 0.7, 1.0);
  for (const lado of [-1, 1]) {
    if (dePie) {
      const cadera = new THREE.Group();
      cadera.position.set(lado * 8.6, 53, 0);
      grupo.add(cadera);
      pieza(new THREE.CapsuleGeometry(7.4, 17, 6, 14), PANTALON, 0, -13.5, 0, cadera);
      const rodilla = new THREE.Group();
      rodilla.position.set(0, -26, 0);
      cadera.add(rodilla);
      pieza(new THREE.CapsuleGeometry(5.6, 14, 6, 14), PANTALON, 0, -13.5, 0, rodilla);
      pieza(new THREE.BoxGeometry(10, 7, 23), CALZADO, 0, -24, 5, rodilla);
      piernas.push({ cadera, rodilla });
      continue;
    }
    acostada(pieza(new THREE.CapsuleGeometry(7.6, 30, 6, 14), PANTALON, lado * 8.6, 51, 18));
    pieza(new THREE.CapsuleGeometry(6, 32, 6, 14), PANTALON, lado * 8.6, 28, 38);
    pieza(new THREE.BoxGeometry(10, 7, 23), CALZADO, lado * 8.6, 4.5, 44).geometry.translate(0, 0, 0);
  }

  // torso con camisa, cuello y cabeza
  const torso = pieza(new THREE.CapsuleGeometry(13.5, 24, 8, 18), a.camisa, 0, ANCLAS.torsoY, 0);
  torso.scale.set(1.18, 1, 0.78);
  pieza(new THREE.CylinderGeometry(4.8, 5.4, 9, 14), piel, 0, 112, 0);

  const brazo = (lado: number) => {
    const hombro = new THREE.Group();
    hombro.position.set(lado * ANCLAS.hombroX, ANCLAS.hombroY, 0);
    grupo.add(hombro);
    pieza(new THREE.SphereGeometry(5.6, 14, 10), a.camisa, 0, 0, 0, hombro);
    pieza(new THREE.CapsuleGeometry(4.8, 17, 6, 12), a.camisa, 0, -13, 0, hombro);
    const codo = new THREE.Group();
    codo.position.set(0, -26, 0);
    codo.rotation.x = -0.5;
    hombro.add(codo);
    pieza(new THREE.SphereGeometry(4.4, 12, 10), a.camisa, 0, 0, 0, codo);
    pieza(new THREE.CapsuleGeometry(4, 15, 6, 12), a.camisa, 0, -12.5, 0, codo);
    pieza(new THREE.SphereGeometry(4.5, 14, 10), piel, 0, -26.5, 0.4, codo).scale.set(0.9, 1.15, 1.0);
    const mano = new THREE.Group();
    mano.position.set(0, -26.5, 0.4);
    codo.add(mano);
    return { hombro, mano };
  };
  const { hombro: brazoI, mano: manoI } = brazo(-1);
  const { hombro: brazoD, mano: manoD } = brazo(1);

  const cabeza = new THREE.Group();
  cabeza.position.set(0, ANCLAS.cabezaY, 0);
  grupo.add(cabeza);
  const cr = pieza(new THREE.SphereGeometry(12, 30, 22), piel, 0, 0, 0, cabeza, 0.55);
  cr.scale.set(0.84, 1.06, 0.95);
  for (const lado of [-1, 1]) pieza(new THREE.SphereGeometry(2.6, 10, 8), piel, lado * 10.2, -0.5, -0.5, cabeza).scale.set(0.5, 1, 0.8);
  pieza(new THREE.SphereGeometry(2.2, 12, 10), mezclarHex(piel, "#a05a3c", 0.12), 0, -2.2, 11.4, cabeza, 0.5).scale.set(0.9, 1, 0.9);

  // pelo: casquete (largo y forma según la persona) y, a veces, melena hacia atrás
  const estilo = indice % 4;
  const casquete = pieza(new THREE.SphereGeometry(12.9, 30, 20, 0, Math.PI * 2, 0, estilo === 3 ? 1.1 : 1.34), a.pelo, 0, 0.5, -0.6, cabeza, 0.8);
  casquete.scale.set(0.86, 1.08, 0.98);
  if (estilo >= 1) pieza(new THREE.SphereGeometry(11, 20, 14), a.pelo, 0, -2, -5.5, cabeza, 0.8).scale.set(0.95, 1.05, 0.8);
  if (estilo === 2) pieza(new THREE.CapsuleGeometry(8.5, 14, 6, 14), a.pelo, 0, -12, -7, cabeza, 0.8).scale.set(1.15, 1, 0.7);

  const abiertos = texturaCaraReal(true, a.pelo, IRIS[indice % IRIS.length]);
  const cerrados = texturaCaraReal(false, a.pelo, IRIS[indice % IRIS.length]);
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(17.5, 13.1), new THREE.MeshStandardMaterial({ map: abiertos, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  cara.position.set(0, -0.2, 11.55);
  cabeza.add(cara);

  return { grupo, torso, cabeza, brazoI, brazoD, manoI, manoD, piernas, cara, abiertos, cerrados, piezas };
}

/** Los muñecos «apagados» (agentes que todavía no les toca) se ven desteñidos. */
export function apagarMunyeco(m: Munyeco, apagado: boolean) {
  for (const p of m.piezas) p.malla.material = apagado ? p.apagado : p.normal;
}

export type Escritorio = { grupo: THREE.Group; pantallas: THREE.Texture[] };

/** Escritorio de oficina: tablero de madera con vetas, dos cajoneras, monitores de frente a la persona, teclado, mouse y taza. */
export function crearEscritorio(e: Rect): Escritorio {
  const grupo = new THREE.Group();
  const pantallas: THREE.Texture[] = [];
  const caja = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    grupo.add(m);
    return m;
  };
  const cx = e.x + e.w / 2;
  const cz = e.y + e.h / 2;
  const fondo = e.h - 8;
  const veta = texturaMadera("#bd8d55");
  const tablero = new THREE.MeshStandardMaterial({ map: conRepeticion(veta, e.w, fondo, 150), roughness: 0.42 });
  const costado = new THREE.MeshStandardMaterial({ map: conRepeticion(veta, 90, 60, 150), color: "#c9a479", roughness: 0.55 });
  const metal = plastico("#9aa0ab", { roughness: 0.3, metalness: 0.6 });
  caja(e.w + 8, 5, fondo, tablero, cx, 63.5, cz);
  // dos cajoneras con sus cajones y manijas
  const fondoCajonera = Math.min(82, fondo - 10);
  for (const lado of [-1, 1]) {
    const x = lado === -1 ? e.x + 34 : e.x + e.w - 34;
    caja(62, 61, fondoCajonera, costado, x, 30.5, cz);
    for (let i = 0; i < 3; i++) {
      caja(54, 17, 1.5, plastico("#b58e5e", { roughness: 0.5 }), x, 12 + i * 20, cz - fondoCajonera / 2 - 0.5);
      caja(18, 2.4, 2.4, metal, x, 12 + i * 20, cz - fondoCajonera / 2 - 2);
    }
  }
  caja(e.w - 130, 36, 2, costado, cx, 40, cz + fondo / 2 - 12);

  // monitores: la pantalla mira a la persona (hacia -z); desde la puerta se ve el respaldo
  const marco = plastico("#15171f", { roughness: 0.4 });
  for (const [i, mx] of [e.x + 26, e.x + e.w - 100].entries()) {
    const x = mx + 38;
    const z = e.y + 58;
    const monitor = new THREE.Group();
    monitor.position.set(x, 0, z);
    monitor.rotation.y = Math.PI + (i === 0 ? -0.18 : 0.18);
    grupo.add(monitor);
    const parte = (g: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number) => {
      const m = new THREE.Mesh(g, mat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      monitor.add(m);
      return m;
    };
    parte(new THREE.CylinderGeometry(15, 17, 2.5, 24), marco, 0, 67.2, 0);
    parte(new THREE.BoxGeometry(5, 26, 4), marco, 0, 81, -1);
    parte(new THREE.BoxGeometry(76, 46, 3.4), marco, 0, 108, 0);
    const tex = texturaPantalla(i === 0 ? PALETA.monitorPantalla : PALETA.monitorPantalla2);
    tex.repeat.set(1, 0.18);
    pantallas.push(tex);
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), new THREE.MeshBasicMaterial({ map: tex }));
    pantalla.position.set(0, 108, 1.8);
    monitor.add(pantalla);
  }

  // teclado, mouse y taza, del lado de la persona
  caja(46, 2.2, 15, plastico("#23262f", { roughness: 0.5 }), cx, 67.6, e.y + 26);
  for (let fila = 0; fila < 3; fila++) caja(40, 0.8, 3.2, plastico("#3b3f4c", { roughness: 0.6 }), cx, 69, e.y + 21.5 + fila * 4.8);
  const raton = new THREE.Mesh(new THREE.SphereGeometry(4.2, 14, 10), plastico("#23262f", { roughness: 0.4 }));
  raton.scale.set(0.8, 0.5, 1.2);
  raton.position.set(cx + 38, 68.2, e.y + 26);
  grupo.add(raton);
  const taza = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 3.6, 8.5, 20), plastico("#ffffff", { roughness: 0.25 }));
  taza.position.set(e.x + e.w - 78, 70.5, e.y + 24);
  taza.castShadow = true;
  grupo.add(taza);
  return { grupo, pantallas };
}

/** Silla de oficina: asiento y respaldo de tela, apoyabrazos, columna y base de cinco patas con ruedas. Mira hacia +z. */
export function crearSilla(): THREE.Group {
  const g = new THREE.Group();
  const tela = new THREE.MeshStandardMaterial({ color: "#2a2e3a", roughness: 0.92 });
  const plasticoNegro = plastico("#15171f", { roughness: 0.45 });
  const parte = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  parte(new THREE.BoxGeometry(46, 8, 44), tela, 0, 42, 4).geometry.translate(0, 0, 0);
  const respaldo = parte(new THREE.BoxGeometry(44, 52, 7), tela, 0, 76, -20);
  respaldo.rotation.x = -0.12;
  for (const lado of [-1, 1]) {
    parte(new THREE.BoxGeometry(4, 3, 26), plasticoNegro, lado * 26, 62, 2);
    parte(new THREE.BoxGeometry(3, 18, 3), plasticoNegro, lado * 26, 52, -8);
  }
  parte(new THREE.CylinderGeometry(3, 3, 24, 12), plasticoNegro, 0, 26, 4);
  parte(new THREE.CylinderGeometry(5, 7, 5, 14), plasticoNegro, 0, 13, 4);
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const pata = parte(new THREE.BoxGeometry(5, 3, 24), plasticoNegro, Math.sin(ang) * 11, 8, 4 + Math.cos(ang) * 11);
    pata.rotation.y = ang;
    parte(new THREE.SphereGeometry(3, 10, 8), plasticoNegro, Math.sin(ang) * 22, 3, 4 + Math.cos(ang) * 22);
  }
  return g;
}

export function crearPlanta(): THREE.Group {
  const g = new THREE.Group();
  const maceta = new THREE.Mesh(new THREE.CylinderGeometry(20, 15, 24, 18), plastico(PALETA.maceta));
  maceta.position.y = 12;
  maceta.castShadow = true;
  g.add(maceta);
  const hojas: [number, number, number, number, string][] = [
    [-14, 46, 0, 18, PALETA.planta],
    [14, 50, -2, 18, PALETA.planta],
    [0, 68, 0, 20, PALETA.planta],
    [-3, 42, 10, 20, PALETA.plantaOscura],
  ];
  for (const [x, y, z, r, color] of hojas) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), plastico(color, { roughness: 0.6 }));
    h.position.set(x, y, z);
    h.scale.y = 1.2;
    h.castShadow = true;
    g.add(h);
  }
  return g;
}

export function crearBebedero(): THREE.Group {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(50, 70, 40), plastico("#e6e8f5"));
  cuerpo.position.y = 35;
  cuerpo.castShadow = true;
  g.add(cuerpo);
  const botella = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 58, 20), plastico(PALETA.agua, { transparent: true, opacity: 0.8, roughness: 0.1 }));
  botella.position.y = 99;
  botella.castShadow = true;
  g.add(botella);
  return g;
}

/** Mesa redonda (elíptica en el plano) de la sala de reuniones, con tres notebooks. */
export function crearMesaRedonda(rx: number, ry: number): THREE.Group {
  const g = new THREE.Group();
  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(rx, rx, 10, 56), plastico(PALETA.maderaTapa, { roughness: 0.5 }));
  tapa.position.y = 59;
  tapa.scale.z = ry / rx;
  tapa.castShadow = true;
  tapa.receiveShadow = true;
  g.add(tapa);
  const pie = new THREE.Mesh(new THREE.CylinderGeometry(40, 50, 54, 24), plastico(PALETA.maderaLado));
  pie.position.y = 27;
  pie.castShadow = true;
  g.add(pie);
  for (const [dx, dz] of [[-80, -10], [80, -10], [0, 50]] as const) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(48, 3, 30), plastico("#3a3f5f"));
    base.position.set(dx, 66.5, dz);
    g.add(base);
    const pantalla = new THREE.Mesh(new THREE.BoxGeometry(48, 30, 3), plastico(PALETA.monitorPantalla, { emissive: PALETA.monitorPantalla, emissiveIntensity: 0.35 }));
    pantalla.position.set(dx, 82, dz - 14);
    pantalla.rotation.x = -0.25;
    g.add(pantalla);
  }
  return g;
}

/** El objeto propio de una sala: cuenta qué hace su agente. Origen en el centro de la base. */
export function crearObjeto(tipo: TipoObjeto, ancho: number): { grupo: THREE.Group; leds: THREE.MeshStandardMaterial[] } {
  const g = new THREE.Group();
  const leds: THREE.MeshStandardMaterial[] = [];
  const mala = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const caja = (w: number, h: number, d: number, color: string, x: number, y: number, z: number) => mala(new THREE.BoxGeometry(w, h, d), plastico(color), x, y, z);
  const cil = (rs: number, ri: number, h: number, color: string, x: number, y: number, z: number) => mala(new THREE.CylinderGeometry(rs, ri, h, 20), plastico(color), x, y, z);

  switch (tipo) {
    case "papelero": {
      cil(24, 19, 48, "#8b8fb0", 0, 24, 0);
      for (const [x, y, z, r] of [[-8, 54, 0, 12], [8, 58, 3, 13], [0, 66, -4, 11]] as const) {
        mala(new THREE.IcosahedronGeometry(r, 0), plastico(PALETA.papel), x, y, z);
      }
      caja(24, 2, 24, PALETA.resalte, -6, 92, 8).rotation.y = 0.5;
      break;
    }
    case "libros": {
      caja(ancho, 110, 24, PALETA.maderaLado, 0, 55, 0);
      const colores = ["#5b8cff", "#ff6b81", "#3ecf6e", "#f2a33a", "#8e6bff", "#2ec4b6"];
      for (let fila = 0; fila < 3; fila++) {
        caja(ancho - 6, 3, 22, PALETA.maderaFrente, 0, 36 + fila * 33, 2);
        for (let i = 0; i < 5; i++) caja(7, 26, 18, colores[(fila * 2 + i) % colores.length], -18 + i * 9, 51 + fila * 33, 3);
      }
      break;
    }
    case "lupa": {
      cil(3, 3, 78, "#5a5f86", 0, 39, 0);
      cil(18, 18, 8, "#5a5f86", 0, 4, 0);
      const aro = mala(new THREE.TorusGeometry(22, 3.6, 12, 32), plastico(PALETA.resalte, { metalness: 0.4 }), 0, 100, 0);
      aro.rotation.y = 0;
      const cristal = mala(new THREE.CircleGeometry(21, 28), plastico("#bfe1f5", { transparent: true, opacity: 0.4 }), 0, 100, 0);
      cristal.castShadow = false;
      cil(2.5, 2.5, 20, PALETA.resalte, 15, 80, 0).rotation.z = 0.6;
      break;
    }
    case "libreta": {
      cil(4, 4, 56, PALETA.maderaLado, 0, 28, 0);
      cil(20, 20, 8, PALETA.maderaLado, 0, 4, 0);
      const izq = caja(24, 4, 34, PALETA.papel, -12, 64, 0);
      izq.rotation.set(-0.5, 0, 0.12);
      const der = caja(24, 4, 34, "#f1ecd6", 12, 64, 0);
      der.rotation.set(-0.5, 0, -0.12);
      break;
    }
    case "servidor": {
      caja(ancho, 110, 40, PALETA.monitorMarco, 0, 55, 0);
      for (let i = 0; i < 4; i++) {
        caja(ancho - 10, 19, 4, "#2b3050", 0, 94 - i * 24, 21);
        const led = new THREE.MeshStandardMaterial({ color: "#35604a", emissive: PALETA.check, emissiveIntensity: 1 });
        leds.push(led);
        mala(new THREE.BoxGeometry(7, 7, 3), led, -ancho / 2 + 14, 94 - i * 24, 24);
      }
      break;
    }
    case "dispositivos": {
      cil(3, 3, 60, "#5a5f86", 0, 30, 0);
      cil(18, 18, 8, "#5a5f86", 0, 4, 0);
      caja(40, 48, 5, PALETA.monitorMarco, -12, 84, 0);
      caja(32, 38, 2, PALETA.monitorPantalla, -12, 84, 3).material = new THREE.MeshBasicMaterial({ color: PALETA.monitorPantalla });
      caja(22, 38, 5, PALETA.monitorMarco, 18, 70, 4);
      caja(16, 28, 2, PALETA.monitorPantalla2, 18, 70, 7).material = new THREE.MeshBasicMaterial({ color: PALETA.monitorPantalla2 });
      break;
    }
    case "portapapeles": {
      caja(ancho, 96, 6, PALETA.maderaFrente, 0, 58, 0);
      caja(ancho - 10, 80, 2, PALETA.papel, 0, 54, 4);
      caja(22, 12, 8, "#8b8fb0", 0, 104, 2);
      for (let i = 0; i < 4; i++) {
        caja(14, 3, 2, PALETA.check, -12, 84 - i * 17, 6);
        caja(24, 3, 2, "#b9bde0", 8, 84 - i * 17, 6);
      }
      caja(8, 40, 8, PALETA.maderaLado, 0, 20, -2);
      break;
    }
    case "trofeo": {
      caja(46, 14, 30, PALETA.maderaLado, 0, 7, 0);
      const oro = plastico("#ffd54a", { metalness: 0.55, roughness: 0.25, emissive: "#8a5a00", emissiveIntensity: 0.25 });
      mala(new THREE.CylinderGeometry(5, 5, 40, 14), oro, 0, 34, 0);
      mala(new THREE.CylinderGeometry(26, 15, 44, 24, 1, true), oro, 0, 76, 0).material = new THREE.MeshStandardMaterial({ color: "#ffd54a", metalness: 0.55, roughness: 0.25, side: THREE.DoubleSide });
      for (const lado of [-1, 1]) {
        const asa = mala(new THREE.TorusGeometry(11, 3, 8, 16, Math.PI), oro, lado * 27, 78, 0);
        asa.rotation.z = lado === 1 ? -Math.PI / 2 : Math.PI / 2;
      }
      break;
    }
  }
  return { grupo: g, leds };
}

