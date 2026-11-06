import * as THREE from "three";
import { tacosEn, type Rect } from "../oficina";
import { APARIENCIAS, PALETA } from "../oficina/paleta";
import type { TipoObjeto } from "../oficina/decoracion";
import { plastico, tacosInstanciados } from "./bloques3d";
import { texturaCara, texturaPantalla } from "./texturas";

const PANTALON = "#2b2f4a";
const GRIS_APAGADO = "#8b8fb0";

type Pieza = { malla: THREE.Mesh; normal: THREE.Material; apagado: THREE.Material };

export type Munyeco = {
  grupo: THREE.Group;
  torso: THREE.Mesh;
  cabeza: THREE.Group;
  brazoI: THREE.Group;
  brazoD: THREE.Group;
  cara: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  abiertos: THREE.Texture;
  cerrados: THREE.Texture;
  piezas: Pieza[];
};

const mezclar = (a: string, b: string, k: number) => `#${new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString()}`;

/** Un muñeco de bloques sentado: cabeza redonda con taco, torso, brazos con manos y piernas. Mira hacia +z. */
export function crearMunyeco(indice: number): Munyeco {
  const a = APARIENCIAS[indice % APARIENCIAS.length];
  const grupo = new THREE.Group();
  const piezas: Pieza[] = [];

  const pieza = (geo: THREE.BufferGeometry, color: string, x: number, y: number, z: number, padre: THREE.Object3D = grupo) => {
    const normal = plastico(color);
    const apagado = plastico(mezclar(color, GRIS_APAGADO, 0.55));
    const malla = new THREE.Mesh(geo, normal);
    malla.position.set(x, y, z);
    malla.castShadow = true;
    malla.receiveShadow = true;
    padre.add(malla);
    piezas.push({ malla, normal, apagado });
    return malla;
  };

  // cadera y piernas
  pieza(new THREE.BoxGeometry(54, 16, 34), PANTALON, 0, 50, 0);
  pieza(new THREE.BoxGeometry(24, 18, 36), PANTALON, -14, 50, 22);
  pieza(new THREE.BoxGeometry(24, 18, 36), PANTALON, 14, 50, 22);
  const torso = pieza(new THREE.BoxGeometry(56, 58, 30), a.camisa, 0, 87, 0);

  const brazo = (lado: number) => {
    const p = new THREE.Group();
    p.position.set(lado * 38, 112, 0);
    grupo.add(p);
    pieza(new THREE.BoxGeometry(14, 44, 16), a.camisa, 0, -22, 0, p);
    pieza(new THREE.SphereGeometry(8.5, 14, 10), PALETA.piel, 0, -50, 0, p);
    return p;
  };
  const brazoI = brazo(-1);
  const brazoD = brazo(1);

  const cabeza = new THREE.Group();
  cabeza.position.set(0, 142, 0);
  grupo.add(cabeza);
  pieza(new THREE.CylinderGeometry(24, 24, 44, 28), PALETA.piel, 0, 0, 0, cabeza);
  pieza(new THREE.CylinderGeometry(24.6, 24.6, 9, 28), a.pelo, 0, 19, 0, cabeza);
  pieza(new THREE.CylinderGeometry(8, 8, 8, 16), a.pelo, 0, 28, 0, cabeza);
  pieza(new THREE.BoxGeometry(46, 30, 8), a.pelo, 0, 5, -20, cabeza);

  const abiertos = texturaCara(true);
  const cerrados = texturaCara(false);
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), new THREE.MeshBasicMaterial({ map: abiertos, transparent: true }));
  cara.position.set(0, -1, 23.6);
  cabeza.add(cara);

  return { grupo, torso, cabeza, brazoI, brazoD, cara, abiertos, cerrados, piezas };
}

/** Los muñecos "apagados" (agentes que todavía no les toca) se ven desteñidos. */
export function apagarMunyeco(m: Munyeco, apagado: boolean) {
  for (const p of m.piezas) p.malla.material = apagado ? p.apagado : p.normal;
}

export type Escritorio = { grupo: THREE.Group; pantallas: THREE.Texture[] };

/** Escritorio de bloques con tacos arriba, dos pantallas, teclado y taza. `e` es el rectángulo del plano. */
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
  const cz = e.y + 52;
  caja(e.w, 60, 84, plastico(PALETA.maderaFrente, { roughness: 0.55 }), cx, 30, cz);
  caja(e.w + 8, 6, 92, plastico(PALETA.maderaTapa, { roughness: 0.5 }), cx, 63, cz);
  grupo.add(tacosInstanciados(tacosEn({ x: e.x + 4, y: e.y + 6, w: e.w - 8, h: 92 }, 16), 66, plastico(PALETA.maderaTapa), 4.5, 4));

  const marco = plastico(PALETA.monitorMarco, { roughness: 0.3 });
  for (const [i, mx] of [e.x + 26, e.x + e.w - 100].entries()) {
    const x = mx + 38;
    const z = e.y + 34;
    caja(14, 22, 10, plastico("#3a3f5f"), x, 77, z);
    caja(76, 56, 8, marco, x, 116, z);
    const tex = texturaPantalla(i === 0 ? PALETA.monitorPantalla : PALETA.monitorPantalla2);
    tex.repeat.set(1, 0.18);
    pantallas.push(tex);
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(66, 44), new THREE.MeshBasicMaterial({ map: tex }));
    pantalla.position.set(x, 116, z + 4.2);
    grupo.add(pantalla);
  }
  caja(88, 4, 26, plastico("#3a3f5f"), cx, 68, e.y + 72);
  const taza = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 14, 18), plastico("#ffffff"));
  taza.position.set(e.x + e.w - 130, 73, e.y + 68);
  taza.castShadow = true;
  grupo.add(taza);
  return { grupo, pantallas };
}

export function crearSilla(): THREE.Group {
  const g = new THREE.Group();
  const mat = plastico(PALETA.sillaColor);
  const parte = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };
  parte(76, 10, 66, 0, 40, 6);
  parte(76, 76, 12, 0, 84, -26);
  parte(10, 36, 10, 0, 18, 6);
  parte(56, 6, 56, 0, 4, 6);
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

export function crearSillon(ancho: number, fondo: number): THREE.Group {
  const g = new THREE.Group();
  const parte = (w: number, h: number, d: number, color: string, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), plastico(color, { roughness: 0.55 }));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };
  parte(ancho, 30, fondo, PALETA.sillonClaro, 0, 15, 0);
  parte(ancho, 58, 20, PALETA.sillon, 0, 59, -fondo / 2 + 10);
  parte(30, 52, fondo, PALETA.sillonClaro, -ancho / 2 + 15, 26, 0);
  parte(30, 52, fondo, PALETA.sillonClaro, ancho / 2 - 15, 26, 0);
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

