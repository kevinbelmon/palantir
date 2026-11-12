import * as THREE from "three";
import { MUNDO, type Sala } from "../oficina";
import { PALETA } from "../oficina/paleta";
import { plastico } from "./bloques3d";
import { ARAÑA_LOBBY, COLUMNAS, LAMPARAS_LOBBY, MESAS_RATONAS, mueblesDeSala, RADIO_COLUMNA, SOFAS_LOBBY } from "./distribucion";
import { crearObjeto } from "./figuras";
import { COLORES_SALA, mezclarHex, placaDePuerta, ventanaDeSala } from "./identidad";
import { crearLamas } from "./oficinas";
import { aleatorio, conRepeticion, texturaAgua, texturaAlfombra, texturaBaldosas, texturaCuadro, texturaPlaca } from "./materiales";
import { ALTURA_ATRIO } from "./persona";
import { textosDe } from "../contenido";
import { AGENTES } from "../flujo";

function caja(padre: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, sombra = true): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = sombra;
  m.receiveShadow = true;
  padre.add(m);
  return m;
}

const tela = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.92 });
const madera = (color = "#4a3322") => plastico(color, { roughness: 0.45 });

/** Un sillón de tres cuerpos (o de uno): base, almohadones del asiento, respaldo y apoyabrazos. Mira hacia +z. */
export function crearSofa(ancho: number, fondo: number, color: string): THREE.Group {
  const g = new THREE.Group();
  const t = tela(color);
  const claro = tela(mezclarHex(color, "#ffffff", 0.1));
  caja(g, ancho, 22, fondo, madera("#2c2118"), 0, 11 + 4, 0);
  const cuerpos = Math.max(1, Math.round(ancho / 50));
  const util = ancho - 28;
  for (let i = 0; i < cuerpos; i++) caja(g, util / cuerpos - 2, 14, fondo - 16, claro, -util / 2 + (i + 0.5) * (util / cuerpos), 33, 6);
  caja(g, ancho, 46, 16, t, 0, 49, -fondo / 2 + 8);
  for (let i = 0; i < cuerpos; i++) caja(g, util / cuerpos - 4, 30, 9, claro, -util / 2 + (i + 0.5) * (util / cuerpos), 52, -fondo / 2 + 20).rotation.x = -0.14;
  for (const lado of [-1, 1]) caja(g, 14, 36, fondo, t, lado * (ancho / 2 - 7), 40, 0);
  return g;
}

/** Cuadro con marco de madera oscura. `giroY` 0 mira a +z, π/2 a +x, -π/2 a -x. */
function colgarCuadro(padre: THREE.Object3D, ancho: number, alto: number, color: string, semilla: number, x: number, y: number, z: number, giroY: number): void {
  const g = new THREE.Group();
  const marco = madera("#2a1d12");
  caja(g, ancho + 8, alto + 8, 3, marco, 0, 0, 0, false);
  const lienzo = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshStandardMaterial({ map: texturaCuadro(color, semilla), roughness: 0.7 }));
  lienzo.position.z = 1.8;
  g.add(lienzo);
  g.position.set(x, y, z);
  g.rotation.y = giroY;
  padre.add(g);
}

/** Lámpara de pie: base, caña y pantalla encendida. */
function crearLamparaDePie(): THREE.Group {
  const g = new THREE.Group();
  const metal = plastico("#2b2f38", { roughness: 0.3, metalness: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(13, 14, 3, 20), metal);
  base.position.y = 1.5;
  const cana = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 128, 10), metal);
  cana.position.y = 65;
  const pantalla = new THREE.Mesh(new THREE.CylinderGeometry(15, 21, 24, 24, 1, true), new THREE.MeshStandardMaterial({ color: "#f6e9cf", emissive: "#ffd9a0", emissiveIntensity: 0.8, side: THREE.DoubleSide, roughness: 0.9 }));
  pantalla.position.y = 138;
  g.add(base, cana, pantalla);
  return g;
}

/**
 * Lo que hace de una oficina un lugar para vivir: sillón de lectura, biblioteca, lámpara de pie y cortinas.
 * Lo que solo se ve al caminar por adentro (cuadros y la placa de la puerta) va en `interior`.
 */
export function amueblarSala(raiz: THREE.Group, interior: THREE.Group, sala: Sala, indice: number): void {
  const acento = COLORES_SALA[indice];
  const a = sala.area;
  const m = mueblesDeSala(sala);
  if (m) {
    const sofa = crearSofa(m.sillon.ancho, m.sillon.fondo, mezclarHex("#cfc5b4", acento, 0.3));
    sofa.position.set(m.sillon.x, 0, m.sillon.z);
    sofa.rotation.y = m.sillon.giro;
    raiz.add(sofa);
    const libreria = crearObjeto("libros", m.libreria.ancho).grupo;
    libreria.position.set(m.libreria.x, 0, m.libreria.z);
    libreria.rotation.y = m.libreria.giro;
    raiz.add(libreria);
    const lampara = crearLamparaDePie();
    lampara.position.set(m.lampara.x, 0, m.lampara.z);
    raiz.add(lampara);
    // cuadros: uno grande sobre el sillón y uno más chico sobre la biblioteca
    colgarCuadro(interior, 120, 80, acento, indice + 1, a.x + 8.8, 130, a.y + 470, Math.PI / 2);
    colgarCuadro(interior, 66, 44, acento, indice + 11, a.x + a.w - 8.8, 168, a.y + 300, -Math.PI / 2);
  }

  // cortinas a los lados de la ventana, con su riel
  if (sala.tipo !== "vidrio") {
    const v = ventanaDeSala(sala);
    const tono = tela(mezclarHex("#3b3a36", acento, 0.3));
    const zPared = a.y + 9;
    for (const x of [v.x - 9, v.x + v.w + 9]) caja(raiz, 18, 100, 5, tono, x, 108, zPared + 3, false);
    caja(raiz, v.w + 56, 3, 4, madera("#2a1d12"), v.x + v.w / 2, 160, zPared + 3, false);
  }

  // la placa de bronce junto a la puerta, del lado del pasillo
  const p = placaDePuerta(sala);
  const t = textosDe(AGENTES[indice].id);
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(56, 21), new THREE.MeshStandardMaterial({ map: texturaPlaca(sala.numero, t.nombre, acento), roughness: 0.4, metalness: 0.3 }));
  placa.position.set(p.x, p.altura, p.z);
  placa.rotation.y = p.giroY;
  interior.add(placa);
}

/** El lobby de la mansión: rincones de estar con sillón y mesa ratona; columnas, araña de cristal y moldura solo al caminar por adentro. */
export function decorarLobby(raiz: THREE.Group, interior: THREE.Group): { liberar: () => void } {
  const baldosas = conRepeticion(texturaBaldosas(), 100, 100, 100);
  const marmol = new THREE.MeshStandardMaterial({ map: baldosas, color: PALETA.marmolGrafito, roughness: 0.22, metalness: 0.05 });

  // rincones de estar
  SOFAS_LOBBY.forEach((s, i) => {
    const sofa = crearSofa(s.ancho, s.fondo, i === 0 ? "#6b4a35" : "#3d4a5c");
    sofa.position.set(s.x, 0, s.z);
    sofa.rotation.y = s.giro;
    raiz.add(sofa);
    const mesa = MESAS_RATONAS[i];
    const anchoAlfombra = 210;
    const fondoAlfombra = 190;
    const alfombra = new THREE.Mesh(new THREE.BoxGeometry(anchoAlfombra, 2, fondoAlfombra), new THREE.MeshStandardMaterial({ map: conRepeticion(texturaAlfombra(i === 0 ? "#1b2236" : "#242a3c"), anchoAlfombra, fondoAlfombra, 90), roughness: 0.95 }));
    alfombra.position.set(mesa.x + mesa.w / 2 + (i === 0 ? 14 : -14), 1, mesa.y + mesa.h / 2);
    alfombra.receiveShadow = true;
    raiz.add(alfombra);
    caja(raiz, mesa.w, 4, mesa.h, plastico("#d7e6ee", { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.8 }), mesa.x + mesa.w / 2, 38, mesa.y + mesa.h / 2);
    for (const [dx, dz] of [[6, 6], [mesa.w - 6, 6], [6, mesa.h - 6], [mesa.w - 6, mesa.h - 6]] as const) caja(raiz, 5, 36, 5, madera(), mesa.x + dx, 18, mesa.y + dz, false);
    const jarron = new THREE.Mesh(new THREE.CylinderGeometry(6, 9, 18, 16), plastico("#3d6f8c", { roughness: 0.2 }));
    jarron.position.set(mesa.x + mesa.w / 2, 49, mesa.y + mesa.h / 2);
    raiz.add(jarron);
    for (const [dx, dy] of [[-3, 64], [4, 68], [0, 73]] as const) {
      const flor = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8), plastico(dy === 68 ? "#ff6b81" : "#ffd54a"));
      flor.position.set(mesa.x + mesa.w / 2 + dx, dy, mesa.y + mesa.h / 2);
      raiz.add(flor);
    }
  });
  for (const l of LAMPARAS_LOBBY) {
    const lampara = crearLamparaDePie();
    lampara.position.set(l.x, 0, l.z);
    raiz.add(lampara);
  }

  // columnas de hormigón pulido que llegan hasta el cielo del atrio, con base y capitel
  for (const c of COLUMNAS) {
    const fuste = new THREE.Mesh(new THREE.CylinderGeometry(RADIO_COLUMNA - 4, RADIO_COLUMNA, ALTURA_ATRIO - 30, 32), marmol);
    fuste.position.set(c.x, ALTURA_ATRIO / 2, c.z);
    fuste.castShadow = true;
    fuste.receiveShadow = true;
    interior.add(fuste);
    caja(interior, RADIO_COLUMNA * 2 + 16, 16, RADIO_COLUMNA * 2 + 16, marmol, c.x, 8, c.z);
    caja(interior, RADIO_COLUMNA * 2 + 16, 14, RADIO_COLUMNA * 2 + 16, marmol, c.x, ALTURA_ATRIO - 7, c.z);
    caja(interior, RADIO_COLUMNA * 2 + 4, 8, RADIO_COLUMNA * 2 + 4, marmol, c.x, ALTURA_ATRIO - 18, c.z);
  }

  // araña de cristal: aro dorado con velas encendidas y una luz cálida
  const dorado = plastico("#d9b866", { metalness: 0.25, roughness: 0.35, emissive: "#5a3f12", emissiveIntensity: 0.55 });
  const llama = new THREE.MeshStandardMaterial({ color: "#fff4d6", emissive: "#ffd89a", emissiveIntensity: 1.6 });
  const altoAraña = ALTURA_ATRIO - 150;
  const aro = new THREE.Mesh(new THREE.TorusGeometry(74, 4, 12, 48), dorado);
  aro.rotation.x = Math.PI / 2;
  aro.position.set(ARAÑA_LOBBY.x, altoAraña, ARAÑA_LOBBY.z);
  interior.add(aro);
  const cadena = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, ALTURA_ATRIO - altoAraña, 8), dorado);
  cadena.position.set(ARAÑA_LOBBY.x, (ALTURA_ATRIO + altoAraña) / 2, ARAÑA_LOBBY.z);
  interior.add(cadena);
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const x = ARAÑA_LOBBY.x + Math.cos(ang) * 74;
    const z = ARAÑA_LOBBY.z + Math.sin(ang) * 74;
    const vela = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 12, 10), plastico("#f4eee0"));
    vela.position.set(x, altoAraña + 8, z);
    const fuego = new THREE.Mesh(new THREE.SphereGeometry(2.8, 10, 8), llama);
    fuego.position.set(x, altoAraña + 16, z);
    const cristal = new THREE.Mesh(new THREE.OctahedronGeometry(4, 0), new THREE.MeshStandardMaterial({ color: "#e6f4ff", roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.75 }));
    cristal.position.set(x, altoAraña - 10, z);
    interior.add(vela, fuego, cristal);
  }
  const luz = new THREE.PointLight("#ffe2b8", 85000, 1250, 2);
  luz.position.set(ARAÑA_LOBBY.x, altoAraña - 10, ARAÑA_LOBBY.z);
  interior.add(luz);

  // lamas de roble sobre las dos paredes laterales, por encima de los sillones
  crearLamas(interior, 380, 120, 773, 168, 1240, Math.PI / 2);
  crearLamas(interior, 330, 120, 2767, 168, 1200, -Math.PI / 2);

  return { liberar: () => baldosas.dispose() };
}

/** El jardín de adelante: setos, una fuente con agua que corre, canteros con flores y faroles a lo largo del camino. */
export function crearJardin(raiz: THREE.Group): { actualizar: (t: number) => void } {
  const seto = new THREE.MeshStandardMaterial({ color: "#2f6b3e", roughness: 1 });
  const azar = aleatorio(5);
  const ancho = MUNDO.ancho;
  const alto = MUNDO.alto;
  const centro = ancho / 2;
  const trozo = (x: number, z: number, w: number, d: number) => {
    const h = 34 + azar() * 8;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), seto);
    m.position.set(x, h / 2 - 1, z);
    m.castShadow = true;
    m.receiveShadow = true;
    raiz.add(m);
  };
  for (let x = -70; x < ancho + 70; x += 80) {
    trozo(x, 8, 78, 40);
    if (Math.abs(x + 40 - centro) > 150) trozo(x, alto + 90, 78, 40);
  }
  for (let z = 48; z < alto + 70; z += 80) {
    trozo(8, z, 40, 78);
    trozo(ancho - 8, z, 40, 78);
  }

  // fuente
  const piedra = new THREE.MeshStandardMaterial({ color: "#c9c1b0", roughness: 0.85 });
  const fz = alto + 860;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(190, 205, 36, 56), piedra);
  base.position.set(centro, -22, fz);
  base.castShadow = true;
  base.receiveShadow = true;
  raiz.add(base);
  const agua = texturaAgua();
  agua.repeat.set(2.5, 2.5);
  const lamina = new THREE.Mesh(new THREE.CircleGeometry(172, 56), new THREE.MeshStandardMaterial({ map: agua, roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.9 }));
  lamina.rotation.x = -Math.PI / 2;
  lamina.position.set(centro, -3.5, fz);
  raiz.add(lamina);
  const pie = new THREE.Mesh(new THREE.CylinderGeometry(20, 28, 110, 24), piedra);
  pie.position.set(centro, 30, fz);
  pie.castShadow = true;
  raiz.add(pie);
  const bandeja = new THREE.Mesh(new THREE.CylinderGeometry(70, 36, 16, 36), piedra);
  bandeja.position.set(centro, 92, fz);
  bandeja.castShadow = true;
  raiz.add(bandeja);
  const chorro = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 60, 12), new THREE.MeshStandardMaterial({ color: "#bfe6ff", transparent: true, opacity: 0.6, roughness: 0.05 }));
  chorro.position.set(centro, 130, fz);
  raiz.add(chorro);
  const gota = new THREE.Mesh(new THREE.SphereGeometry(13, 16, 12), new THREE.MeshStandardMaterial({ color: "#bfe6ff", transparent: true, opacity: 0.6, roughness: 0.05 }));
  gota.position.set(centro, 165, fz);
  raiz.add(gota);

  // faroles a los dos lados del camino
  const hierro = plastico("#23262d", { metalness: 0.5, roughness: 0.4 });
  const luzFarol = new THREE.MeshStandardMaterial({ color: "#fff3d0", emissive: "#ffd48a", emissiveIntensity: 1.2 });
  for (let k = 0; k < 5; k++) {
    for (const lado of [-1, 1]) {
      const x = centro + lado * 130;
      const z = alto + 160 + k * 150;
      const poste = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 120, 10), hierro);
      poste.position.set(x, 20, z);
      poste.castShadow = true;
      const farol = new THREE.Mesh(new THREE.SphereGeometry(10, 14, 10), luzFarol);
      farol.position.set(x, 88, z);
      raiz.add(poste, farol);
    }
  }

  // canteros con flores
  const tierra = plastico("#5a3d26", { roughness: 1 });
  const colores = ["#ff6b81", "#ffd54a", "#ffffff", "#c58bff", "#ff9f43"];
  for (const lado of [-1, 1]) {
    for (const z of [alto + 120, alto + 420]) {
      const x = centro + lado * 260;
      caja(raiz, 150, 12, 70, tierra, x, 0, z, false);
      for (let i = 0; i < 16; i++) {
        const flor = new THREE.Mesh(new THREE.SphereGeometry(6 + azar() * 3, 10, 8), plastico(colores[Math.floor(azar() * colores.length)]));
        flor.position.set(x - 66 + azar() * 132, 12 + azar() * 6, z - 28 + azar() * 56);
        raiz.add(flor);
      }
    }
  }

  return {
    actualizar: (t) => {
      agua.offset.set(t * 0.02, t * 0.013);
      gota.position.y = 165 + Math.sin(t * 2) * 4;
    },
  };
}
