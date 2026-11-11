import * as THREE from "three";
import { MUNDO, type Rect, type Sala } from "../oficina";
import { PALETA } from "../oficina/paleta";
import { plastico } from "./bloques3d";
import { conRepeticion, texturaAlfombra } from "./materiales";
import { alfombraDeSala, ALTO_MARCO, COLORES_SALA, marcoDePuerta, mezclarHex, relojDeSala, ventanaDeSala } from "./identidad";

const centro = (r: Rect) => ({ x: r.x + r.w / 2, z: r.y + r.h / 2 });

function caja(raiz: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, sombra = true): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = sombra;
  m.receiveShadow = true;
  raiz.add(m);
  return m;
}

/** Cielo visto por una ventana: celeste arriba y casi blanco abajo. */
function texturaCielo(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, "#7fb6ee");
    g.addColorStop(1, "#e8f4ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.ellipse(20, 34, 12, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(30, 31, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Lo que hace propia a una oficina: su alfombra, el marco de su puerta, una ventana, un reloj, una lámpara y su propia luz cálida. */
export function decorarSala(raiz: THREE.Group, sala: Sala, indice: number): void {
  const acento = COLORES_SALA[indice];
  const a = sala.area;

  // alfombra del color de su agente, con tacos
  const al = alfombraDeSala(sala);
  const ca = centro(al);
  const colorAlfombra = mezclarHex("#8a8f9c", acento, 0.62);
  const fibra = conRepeticion(texturaAlfombra(colorAlfombra), al.w, al.h, 90);
  caja(raiz, al.w, 3, al.h, new THREE.MeshStandardMaterial({ map: fibra, roughness: 0.95 }), ca.x, 1.5, ca.z, false);

  // marco de la puerta, para que se vea la entrada de cada oficina
  const marco = marcoDePuerta(sala);
  const matMarco = plastico(acento, { roughness: 0.35 });
  for (const p of marco.postes) {
    const c = centro(p);
    caja(raiz, p.w, ALTO_MARCO, p.h, matMarco, c.x, ALTO_MARCO / 2, c.z);
  }
  const d = centro(marco.dintel);
  caja(raiz, marco.dintel.w, 14, marco.dintel.h, matMarco, d.x, ALTO_MARCO + 7, d.z);

  // ventana en la pared del fondo
  const v = ventanaDeSala(sala);
  const zPared = a.y + 8;
  const cx = v.x + v.w / 2;
  const cy = v.base + v.alto / 2;
  const marcoVentana = plastico("#f4f3ee", { roughness: 0.4 });
  const cielo = new THREE.Mesh(new THREE.PlaneGeometry(v.w - 12, v.alto - 12), new THREE.MeshBasicMaterial({ map: texturaCielo() }));
  cielo.position.set(cx, cy, zPared + 0.6);
  raiz.add(cielo);
  caja(raiz, v.w, 6, 4, marcoVentana, cx, v.base + 3, zPared + 2, false);
  caja(raiz, v.w, 6, 4, marcoVentana, cx, v.base + v.alto - 3, zPared + 2, false);
  caja(raiz, 6, v.alto, 4, marcoVentana, v.x + 3, cy, zPared + 2, false);
  caja(raiz, 6, v.alto, 4, marcoVentana, v.x + v.w - 3, cy, zPared + 2, false);
  caja(raiz, 4, v.alto - 12, 3, marcoVentana, cx, cy, zPared + 2, false);

  // reloj de pared
  const r = relojDeSala(sala);
  const esfera = new THREE.Mesh(new THREE.CylinderGeometry(r.radio, r.radio, 4, 28), plastico("#ffffff", { roughness: 0.3 }));
  esfera.rotation.x = Math.PI / 2;
  esfera.position.set(r.x, r.altura, zPared + 2);
  raiz.add(esfera);
  const aguja = (largo: number, giro: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, largo, 1.5), plastico("#1d2133"));
    m.geometry.translate(0, largo / 2, 0);
    m.position.set(r.x, r.altura, zPared + 4.6);
    m.rotation.z = giro;
    raiz.add(m);
  };
  aguja(r.radio * 0.6, -((indice * 37) % 360) * (Math.PI / 180));
  aguja(r.radio * 0.85, -((indice * 97 + 40) % 360) * (Math.PI / 180));

  // lámpara de escritorio y una luz cálida que cae sobre la oficina
  if (sala.tipo !== "vidrio") {
    const e = sala.escritorio;
    const lx = e.x + e.w - 36;
    const lz = e.y + 26;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(9, 10, 4, 18), plastico("#2b2f4a"));
    base.position.set(lx, 68, lz);
    raiz.add(base);
    const brazo = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 34, 8), plastico("#2b2f4a"));
    brazo.position.set(lx, 85, lz);
    raiz.add(brazo);
    const pantalla = new THREE.Mesh(new THREE.ConeGeometry(14, 14, 20, 1, true), new THREE.MeshStandardMaterial({ color: acento, emissive: "#ffcf80", emissiveIntensity: 0.9, side: THREE.DoubleSide }));
    pantalla.position.set(lx, 104, lz);
    raiz.add(pantalla);
  }
  const luz = new THREE.PointLight("#ffe0b0", 22000, 650, 2);
  luz.position.set(sala.personaje.x, 150, a.y + a.h / 2);
  raiz.add(luz);
}

/** El techo del edificio, con paneles de luz. Solo se ve al recorrerlo por adentro (desde arriba taparía todo). */
export function crearTecho(raiz: THREE.Group, altura: number): THREE.Group {
  const grupo = new THREE.Group();
  const losa = new THREE.Mesh(new THREE.PlaneGeometry(MUNDO.ancho - 80, MUNDO.alto - 80), new THREE.MeshStandardMaterial({ color: "#f3f1ec", roughness: 0.95, side: THREE.DoubleSide }));
  losa.rotation.x = Math.PI / 2;
  losa.position.set(MUNDO.ancho / 2, altura, MUNDO.alto / 2);
  losa.receiveShadow = false;
  grupo.add(losa);
  const panel = new THREE.MeshStandardMaterial({ color: "#fffdf4", emissive: "#fff3d6", emissiveIntensity: 1.1 });
  for (let x = 220; x < MUNDO.ancho - 100; x += 300) {
    for (let z = 200; z < MUNDO.alto - 100; z += 280) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(110, 3, 55), panel);
      p.position.set(x, altura - 1.5, z);
      grupo.add(p);
    }
  }
  grupo.visible = false;
  raiz.add(grupo);
  return grupo;
}

/** El mostrador de recepción del lobby. */
export function crearRecepcion(raiz: THREE.Group): void {
  const x = 1400;
  const z = 1075;
  caja(raiz, 300, 62, 56, plastico(PALETA.maderaFrente, { roughness: 0.55 }), x, 31, z);
  caja(raiz, 316, 7, 72, plastico("#f4f3ee", { roughness: 0.35 }), x, 65.5, z);
  caja(raiz, 64, 36, 6, plastico(PALETA.monitorMarco), x - 70, 92, z - 6);
  caja(raiz, 54, 28, 2, new THREE.MeshBasicMaterial({ color: PALETA.monitorPantalla }), x - 70, 92, z - 2.5, false);
  const florero = new THREE.Mesh(new THREE.CylinderGeometry(9, 7, 22, 16), plastico("#9bd6f2"));
  florero.position.set(x + 100, 80, z);
  raiz.add(florero);
  for (const [dx, dy] of [[-5, 104], [6, 108], [0, 114]] as const) {
    const flor = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), plastico(dy === 108 ? "#ff6b81" : "#ffd54a"));
    flor.position.set(x + 100 + dx, dy, z);
    raiz.add(flor);
  }
}

/** Pasto alrededor del edificio y unos árboles de bloques, para que el edificio no flote en la nada. */
export function crearExterior(raiz: THREE.Group): void {
  const pasto = new THREE.Mesh(new THREE.PlaneGeometry(9000, 6000), new THREE.MeshStandardMaterial({ color: "#5c8f5f", roughness: 1 }));
  pasto.rotation.x = -Math.PI / 2;
  pasto.position.set(MUNDO.ancho / 2, -39.5, MUNDO.alto / 2);
  pasto.receiveShadow = true;
  raiz.add(pasto);

  const tronco = plastico("#8a5a2b");
  const hojas = [plastico("#3f8f55"), plastico("#4da363"), plastico("#357a49")];
  const arbol = (x: number, z: number, escala: number, n: number) => {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(12, 16, 70, 12), tronco);
    t.position.y = 35 - 40;
    t.castShadow = true;
    g.add(t);
    for (const [dx, dy, r] of [[0, 90, 56], [-26, 62, 40], [28, 66, 42]] as const) {
      const h = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), hojas[(n + Math.abs(dx)) % hojas.length]);
      h.position.set(dx, dy - 40, 0);
      h.castShadow = true;
      g.add(h);
    }
    g.position.set(x, 0, z);
    g.scale.setScalar(escala);
    raiz.add(g);
  };
  const ancho = MUNDO.ancho;
  const alto = MUNDO.alto;
  let n = 0;
  for (let x = -200; x <= ancho + 200; x += 330) {
    arbol(x, -150 - ((n * 53) % 90), 1 + ((n * 7) % 5) / 10, n++);
    arbol(x + 120, alto + 150 + ((n * 41) % 90), 1 + ((n * 3) % 5) / 10, n++);
  }
  for (let z = 100; z <= alto - 100; z += 330) {
    arbol(-170 - ((n * 29) % 80), z, 1 + ((n * 7) % 4) / 10, n++);
    arbol(ancho + 170 + ((n * 31) % 80), z + 90, 1 + ((n * 5) % 4) / 10, n++);
  }

  // un camino de bloques claros hacia la puerta de abajo del edificio
  const camino = plastico("#cfc6b0", { roughness: 0.6 });
  for (let i = 0; i < 8; i++) {
    const piedra = new THREE.Mesh(new THREE.BoxGeometry(110, 6, 70), camino);
    piedra.position.set(ancho / 2 + (i % 2 === 0 ? -14 : 14), -37, alto + 40 + i * 80);
    piedra.receiveShadow = true;
    raiz.add(piedra);
  }
}
