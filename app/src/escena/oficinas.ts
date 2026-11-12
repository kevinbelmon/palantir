import * as THREE from "three";
import { LOBBY, MUNDO, PATIO, restarRectes, SALAS, type Rect, type Sala } from "../oficina";
import { PALETA } from "../oficina/paleta";
import { plastico } from "./bloques3d";
import { ARBOL_PATIO, BANCO_PATIO, CANTEROS_PATIO, RECEPCION } from "./distribucion";
import { conRepeticion, texturaAlfombra, texturaCuadro, texturaGrava, texturaLamas } from "./materiales";
import { alfombraDeSala, ALTO_DINTEL, ALTO_MARCO, COLORES_SALA, GROSOR_MARCO, marcoDePuerta, mezclarHex, relojDeSala, ventanaDeSala } from "./identidad";

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

/**
 * Lo que hace propia a una oficina: su alfombra, el marco de su puerta, una ventana, un reloj, una lámpara
 * y su propia luz cálida. En la sala de vidrio, en cambio, la fachada se arma con mullones de acero.
 */
export function decorarSala(raiz: THREE.Group, interior: THREE.Group, sala: Sala, indice: number): void {
  const acento = COLORES_SALA[indice];
  const a = sala.area;

  // alfombra del color de su agente
  const al = alfombraDeSala(sala);
  const ca = centro(al);
  const colorAlfombra = mezclarHex("#8a8f9c", acento, 0.62);
  const fibra = conRepeticion(texturaAlfombra(colorAlfombra), al.w, al.h, 90);
  caja(raiz, al.w, 3, al.h, new THREE.MeshStandardMaterial({ map: fibra, roughness: 0.95 }), ca.x, 1.5, ca.z, false);

  // marco de la puerta: más grueso que la pared, si no las caras titilan
  const marco = marcoDePuerta(sala);
  // el marco lleva el color del agente, pero oscurecido: al lado del vidrio y la piedra, un color puro saltaría
  const matMarco = plastico(mezclarHex(acento, "#12141a", 0.32), { roughness: 0.38 });
  for (const p of marco.postes) {
    const c = centro(p);
    caja(raiz, GROSOR_MARCO, ALTO_MARCO, GROSOR_MARCO, matMarco, c.x, ALTO_MARCO / 2, c.z);
  }
  const d = centro(marco.dintel);
  caja(raiz, marco.dintel.w + 4, ALTO_DINTEL, marco.dintel.h + 4, matMarco, d.x, ALTO_MARCO + ALTO_DINTEL / 2, d.z);

  // ventana en la pared del fondo (la sala de vidrio ya es toda ventana)
  const zPared = a.y + 8;
  if (sala.tipo !== "vidrio") {
    const v = ventanaDeSala(sala);
    const cx = v.x + v.w / 2;
    const cy = v.base + v.alto / 2;
    const marcoVentana = plastico(PALETA.acero, { roughness: 0.35 });
    const cielo = new THREE.Mesh(new THREE.PlaneGeometry(v.w - 12, v.alto - 12), new THREE.MeshBasicMaterial({ map: texturaCielo() }));
    cielo.position.set(cx, cy, zPared + 0.6);
    raiz.add(cielo);
    caja(raiz, v.w, 6, 4, marcoVentana, cx, v.base + 3, zPared + 2, false);
    caja(raiz, v.w, 6, 4, marcoVentana, cx, v.base + v.alto - 3, zPared + 2, false);
    caja(raiz, 6, v.alto, 4, marcoVentana, v.x + 3, cy, zPared + 2, false);
    caja(raiz, 6, v.alto, 4, marcoVentana, v.x + v.w - 3, cy, zPared + 2, false);
    caja(raiz, 4, v.alto - 12, 3, marcoVentana, cx, cy, zPared + 2, false);
  } else {
    // mullones de acero cada 180, de piso a techo: la fachada de vidrio de la casa moderna
    const acero = plastico(PALETA.acero, { roughness: 0.3, metalness: 0.4 });
    const alto = 235;
    for (let x = a.x + 90; x < a.x + a.w; x += 180) {
      caja(interior, 7, alto, 7, acero, x, alto / 2, a.y, false);
      caja(interior, 7, alto, 7, acero, x, alto / 2, a.y + a.h, false);
    }
    for (let z = a.y + 90; z < a.y + a.h; z += 180) caja(interior, 7, alto, 7, acero, a.x + a.w, alto / 2, z, false);
    // montante horizontal a media altura, que corta la fachada en dos paños
    caja(interior, a.w, 5, 6, acero, a.x + a.w / 2, 118, a.y + a.h, false);
    caja(interior, 6, 5, a.h, acero, a.x + a.w, 118, a.y + a.h / 2, false);
  }

  // reloj de pared
  const r = relojDeSala(sala);
  const esfera = new THREE.Mesh(new THREE.CylinderGeometry(r.radio, r.radio, 4, 28), plastico("#e8e6df", { roughness: 0.35 }));
  esfera.rotation.x = Math.PI / 2;
  esfera.position.set(r.x, r.altura, zPared + 2);
  raiz.add(esfera);
  const aguja = (largo: number, giro: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, largo, 1.5), plastico(PALETA.acero));
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
    const lx = e.x + e.w - 40;
    const lz = e.y + 26;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(9, 10, 4, 18), plastico(PALETA.acero));
    base.position.set(lx, 68, lz);
    raiz.add(base);
    const brazo = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 34, 8), plastico(PALETA.acero));
    brazo.position.set(lx, 85, lz);
    raiz.add(brazo);
    const pantalla = new THREE.Mesh(new THREE.ConeGeometry(14, 14, 20, 1, true), new THREE.MeshStandardMaterial({ color: acento, emissive: "#ffcf80", emissiveIntensity: 0.9, side: THREE.DoubleSide }));
    pantalla.position.set(lx, 104, lz);
    raiz.add(pantalla);
  }
  // un carril de luz cálido que cae sobre el escritorio (o sobre la mesa de reuniones), como en una casa de verdad
  const mesa = sala.tipo === "vidrio" ? { x: a.x + a.w / 2, y: a.y + 760 } : { x: a.x + a.w / 2, y: sala.escritorio.y + sala.escritorio.h / 2 };
  const luz = new THREE.SpotLight("#ffd7a0", 8500, 700, 0.46, 0.9, 1.3);
  luz.position.set(mesa.x, 198, mesa.y - 190);
  luz.target.position.set(mesa.x, 64, mesa.y - 10);
  raiz.add(luz, luz.target);
}

/**
 * El techo de la casa, con paneles de luz. Tiene dos agujeros: el atrio del lobby, que sube al doble de
 * altura con su lucernario, y el patio seco, que queda a la intemperie. Solo se ve al recorrer por adentro.
 */
export function crearTecho(raiz: THREE.Group, altura: number, alturaAtrio: number): THREE.Group {
  const grupo = new THREE.Group();
  const losa = new THREE.MeshStandardMaterial({ color: PALETA.techo, roughness: 0.95, side: THREE.DoubleSide });
  const base: Rect = { x: 60, y: 60, w: MUNDO.ancho - 120, h: MUNDO.alto - 120 };
  const zonas = restarRectes(base, [LOBBY, PATIO]);
  const panel = new THREE.MeshStandardMaterial({ color: "#d8d2c2", emissive: PALETA.panelLuz, emissiveIntensity: 0.9 });

  for (const r of zonas) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.h), losa);
    m.rotation.x = Math.PI / 2;
    m.position.set(r.x + r.w / 2, altura, r.y + r.h / 2);
    grupo.add(m);
    for (let x = r.x + 150; x < r.x + r.w - 90; x += 300) {
      for (let z = r.y + 170; z < r.y + r.h - 90; z += 280) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(110, 3, 55), panel);
        p.position.set(x, altura - 1.5, z);
        grupo.add(p);
      }
    }
  }

  // el atrio: cielo alto sobre el lobby, con un lucernario de vidrio en el medio y la franja que cierra el borde
  const cx = LOBBY.x + LOBBY.w / 2;
  const cz = LOBBY.y + LOBBY.h / 2;
  const alto = alturaAtrio - altura;
  const medio = (altura + alturaAtrio) / 2;
  const agujero: Rect = { x: cx - (LOBBY.w - 520) / 2, y: cz - (LOBBY.h - 260) / 2, w: LOBBY.w - 520, h: LOBBY.h - 260 };
  for (const r of restarRectes({ x: LOBBY.x, y: LOBBY.y, w: LOBBY.w, h: LOBBY.h }, [agujero])) {
    const trozo = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.h), losa);
    trozo.rotation.x = Math.PI / 2;
    trozo.position.set(r.x + r.w / 2, alturaAtrio, r.y + r.h / 2);
    grupo.add(trozo);
  }
  caja(grupo, LOBBY.w, alto, 12, losa, cx, medio, LOBBY.y);
  caja(grupo, LOBBY.w, alto, 12, losa, cx, medio, LOBBY.y + LOBBY.h);
  caja(grupo, 12, alto, LOBBY.h, losa, LOBBY.x, medio, cz);
  caja(grupo, 12, alto, LOBBY.h, losa, LOBBY.x + LOBBY.w, medio, cz);

  // el lucernario: vidrio con montantes negros y el cielo de la noche por encima
  const noche = new THREE.Mesh(new THREE.PlaneGeometry(agujero.w, agujero.h), new THREE.MeshBasicMaterial({ color: "#0c1424", side: THREE.DoubleSide }));
  noche.rotation.x = Math.PI / 2;
  noche.position.set(cx, alturaAtrio + 46, cz);
  grupo.add(noche);
  const vidrioCielo = new THREE.Mesh(
    new THREE.PlaneGeometry(agujero.w, agujero.h),
    new THREE.MeshPhysicalMaterial({ color: "#9fc4dd", transparent: true, opacity: 0.16, roughness: 0.03, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }),
  );
  vidrioCielo.rotation.x = Math.PI / 2;
  vidrioCielo.position.set(cx, alturaAtrio - 2, cz);
  grupo.add(vidrioCielo);
  const montante = plastico(PALETA.acero, { roughness: 0.3, metalness: 0.35 });
  for (let x = agujero.x + 140; x < agujero.x + agujero.w; x += 140) caja(grupo, 8, 14, agujero.h, montante, x, alturaAtrio - 6, cz);
  caja(grupo, agujero.w, 14, 8, montante, cx, alturaAtrio - 6, agujero.y);
  caja(grupo, agujero.w, 14, 8, montante, cx, alturaAtrio - 6, agujero.y + agujero.h);

  // luz indirecta alrededor del lucernario: la franja cálida que hace que el atrio no sea un agujero negro
  const indirecta = new THREE.MeshStandardMaterial({ color: "#7a6a52", emissive: "#ffd9a4", emissiveIntensity: 0.7 });
  const marco = 22;
  caja(grupo, agujero.w + marco * 2, 6, marco, indirecta, cx, alturaAtrio - 12, agujero.y - marco / 2);
  caja(grupo, agujero.w + marco * 2, 6, marco, indirecta, cx, alturaAtrio - 12, agujero.y + agujero.h + marco / 2);
  caja(grupo, marco, 6, agujero.h, indirecta, agujero.x - marco / 2, alturaAtrio - 12, cz);
  caja(grupo, marco, 6, agujero.h, indirecta, agujero.x + agujero.w + marco / 2, alturaAtrio - 12, cz);

  // la luz que entra por el lucernario
  for (const dx of [-430, 430]) {
    const luz = new THREE.PointLight("#e8f0ff", 26000, 1500, 2);
    luz.position.set(cx + dx, alturaAtrio - 70, cz);
    grupo.add(luz);
  }
  const calida = new THREE.PointLight("#ffd9a8", 16000, 1300, 2);
  calida.position.set(cx, alturaAtrio - 130, cz);
  grupo.add(calida);

  grupo.visible = false;
  raiz.add(grupo);
  return grupo;
}

/** El mostrador de recepción: un bloque de piedra con su tapa, el monitor de quien atiende y una luz al pie. */
export function crearRecepcion(raiz: THREE.Group): void {
  const r = RECEPCION;
  const cx = r.x + r.w / 2;
  const cz = r.y + r.h / 2;
  const piedra = new THREE.MeshStandardMaterial({ color: PALETA.piedraClara, roughness: 0.4, metalness: 0.06 });
  caja(raiz, r.w, 62, r.h, piedra, cx, 31, cz);
  caja(raiz, r.w + 16, 7, r.h + 10, plastico("#15171d", { roughness: 0.28 }), cx, 65.5, cz);
  // el monitor mira a la recepcionista, que está del lado de adentro (el sur)
  caja(raiz, 62, 34, 5, plastico(PALETA.monitorMarco), cx - 96, 88, r.y + r.h - 12);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(54, 26), new THREE.MeshBasicMaterial({ color: PALETA.monitorPantalla }));
  pantalla.position.set(cx - 96, 88, r.y + r.h - 9.4);
  raiz.add(pantalla);
  // florero y una tira de luz al pie del mostrador
  const florero = new THREE.Mesh(new THREE.CylinderGeometry(9, 7, 22, 16), plastico("#9bd6f2"));
  florero.position.set(cx + 110, 80, cz);
  raiz.add(florero);
  for (const [dx, dy] of [[-5, 104], [6, 108], [0, 114]] as const) {
    const flor = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), plastico(dy === 108 ? "#ff6b81" : "#ffd54a"));
    flor.position.set(cx + 110 + dx, dy, cz);
    raiz.add(flor);
  }
  caja(raiz, r.w - 60, 2, 4, new THREE.MeshStandardMaterial({ color: "#ffe9c4", emissive: "#ffd9a0", emissiveIntensity: 0.6 }), cx, 58, r.y + r.h + 1.5, false);
}

/** El patio seco: grava, un árbol en el medio y un banco de piedra. Se ve a través del vidrio del review. */
export function crearPatio(raiz: THREE.Group): void {
  const grava = new THREE.MeshStandardMaterial({ map: conRepeticion(texturaGrava(), PATIO.w, PATIO.h, 110), roughness: 1 });
  caja(raiz, PATIO.w, 10, PATIO.h, grava, PATIO.x + PATIO.w / 2, -3, PATIO.y + PATIO.h / 2, false);

  // canteros que separan el patio del pasillo, para que sea un recinto y no un hueco
  const piedra = plastico(PALETA.piedra, { roughness: 0.9 });
  const seto = new THREE.MeshStandardMaterial({ color: "#2f6b3e", roughness: 1 });
  for (const c of CANTEROS_PATIO) {
    caja(raiz, c.w, 42, c.h, piedra, c.x + c.w / 2, 21, c.y + c.h / 2);
    caja(raiz, c.w - 20, 26, c.h - 8, seto, c.x + c.w / 2, 50, c.y + c.h / 2, false);
  }

  // el árbol: tronco alto y tres copas, que se ve desde adentro de la sala de vidrio
  const tronco = plastico("#8a5a2b");
  const hojas = [plastico("#3f8f55"), plastico("#4da363"), plastico("#357a49")];
  const t = new THREE.Mesh(new THREE.CylinderGeometry(13, 19, 210, 12), tronco);
  t.position.set(ARBOL_PATIO.x, 105, ARBOL_PATIO.z);
  t.castShadow = true;
  raiz.add(t);
  for (const [dx, dy, dz, r] of [[0, 260, 0, 96], [-62, 218, 14, 66], [58, 232, -16, 70]] as const) {
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), hojas[Math.abs(dx) % hojas.length]);
    h.position.set(ARBOL_PATIO.x + dx, dy, ARBOL_PATIO.z + dz);
    h.castShadow = true;
    raiz.add(h);
  }

  // banco de piedra contra la pared del patio
  caja(raiz, BANCO_PATIO.w, 16, BANCO_PATIO.h, piedra, BANCO_PATIO.x + BANCO_PATIO.w / 2, 26, BANCO_PATIO.y + BANCO_PATIO.h / 2);
  for (const dz of [0.2, 0.8]) caja(raiz, BANCO_PATIO.w - 14, 18, 24, piedra, BANCO_PATIO.x + BANCO_PATIO.w / 2, 9, BANCO_PATIO.y + BANCO_PATIO.h * dz, false);
}

/**
 * Arte retroiluminado en las paredes de los pasillos: llena la vista al caminar sin encender más luces.
 * Cada cuadro lleva el color del agente de su oficina, así el pasillo también cuenta el recorrido.
 */
export function crearGaleria(interior: THREE.Group): void {
  const marco = plastico(PALETA.acero, { roughness: 0.35, metalness: 0.2 });
  SALAS.forEach((sala, i) => {
    if (sala.tipo === "vidrio") return;
    const a = sala.area;
    const arriba = a.y < LOBBY.y;
    const x = a.x + 130;
    const z = arriba ? a.y + a.h + 8 : a.y - 8;
    const tex = texturaCuadro(COLORES_SALA[i], i + 3);
    const lienzo = new THREE.Mesh(
      new THREE.PlaneGeometry(170, 110),
      new THREE.MeshStandardMaterial({ map: tex, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: 0.3, roughness: 0.85 }),
    );
    lienzo.position.set(x, 128, z + (arriba ? 2 : -2));
    lienzo.rotation.y = arriba ? 0 : Math.PI;
    interior.add(lienzo);
    caja(interior, 182, 122, 6, marco, x, 128, z + (arriba ? -2 : 2), false);
  });
}

/** Línea de luz al pie de las paredes: guía el recorrido mientras se camina por adentro. */
export function crearLucesDePiso(interior: THREE.Group): void {
  const tira = new THREE.MeshStandardMaterial({ color: "#4a4436", emissive: "#ffcf90", emissiveIntensity: 0.22 });
  const ancho = MUNDO.ancho - 320;
  caja(interior, ancho, 3, 4, tira, MUNDO.ancho / 2, 16, 812, false);
  caja(interior, ancho, 3, 4, tira, MUNDO.ancho / 2, 16, 1848, false);
  caja(interior, 4, 3, LOBBY.h, tira, LOBBY.x + 6, 16, LOBBY.y + LOBBY.h / 2, false);
  caja(interior, 4, 3, LOBBY.h, tira, LOBBY.x + LOBBY.w - 6, 16, LOBBY.y + LOBBY.h / 2, false);
}

/** Pasto alrededor de la casa y unos árboles de bloques, para que el edificio no flote en la nada. */
export function crearExterior(raiz: THREE.Group): void {
  const pasto = new THREE.Mesh(new THREE.PlaneGeometry(14000, 11000), new THREE.MeshStandardMaterial({ color: "#2e4a33", roughness: 1 }));
  pasto.rotation.x = -Math.PI / 2;
  pasto.position.set(MUNDO.ancho / 2, -39.5, MUNDO.alto / 2);
  pasto.receiveShadow = true;
  raiz.add(pasto);

  const tronco = plastico("#6d4724");
  const hojas = [plastico("#2f6f43"), plastico("#3d844f"), plastico("#28603a")];
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
  for (let x = -260; x <= ancho + 260; x += 360) {
    arbol(x, -190 - ((n * 53) % 110), 1.1 + ((n * 7) % 6) / 10, n++);
    arbol(x + 140, alto + 190 + ((n * 41) % 110), 1.1 + ((n * 3) % 6) / 10, n++);
  }
  for (let z = 100; z <= alto - 100; z += 360) {
    arbol(-230 - ((n * 29) % 90), z, 1.1 + ((n * 7) % 5) / 10, n++);
    arbol(ancho + 230 + ((n * 31) % 90), z + 100, 1.1 + ((n * 5) % 5) / 10, n++);
  }

  // un camino de losas hacia la puerta de abajo
  const camino = plastico("#8d8a80", { roughness: 0.55 });
  for (let i = 0; i < 10; i++) {
    const losa = new THREE.Mesh(new THREE.BoxGeometry(150, 6, 80), camino);
    losa.position.set(ancho / 2 + (i % 2 === 0 ? -18 : 18), -37, alto + 60 + i * 90);
    losa.receiveShadow = true;
    raiz.add(losa);
  }
}

/** Un paño de lamas verticales de roble, que le da calor a la piedra y al vidrio. */
export function crearLamas(padre: THREE.Object3D, ancho: number, alto: number, x: number, y: number, z: number, giroY: number): void {
  const madera = new THREE.MeshStandardMaterial({ map: conRepeticion(texturaLamas(PALETA.roble), ancho, alto, 60), roughness: 0.62 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, 10), madera);
  m.position.set(x, y, z);
  m.rotation.y = giroY;
  m.castShadow = true;
  m.receiveShadow = true;
  padre.add(m);
}
