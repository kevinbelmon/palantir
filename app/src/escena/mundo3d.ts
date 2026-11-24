import * as THREE from "three";
import type { EstadoAgente, UbicacionBrief } from "../flujo";
import { AGENTES } from "../flujo";
import { etiquetaDeEstado, textoEtiqueta, textosDe } from "../contenido";
import { CARTEL_CENTRAL, LOBBY, MUNDO, PAPELERIA, puntoEnRuta, rectBrief, rectDocumento, RUTA, SALAS, estadoDeSegmento, type EstadoTramo, type Sala } from "../oficina";
import { BEBEDERO, COLEGAS_REVIEW, ESTANTE_PAPELERIA, MESA_REDONDA_REVIEW, OBJETOS_SALA, PLANTAS } from "../oficina/decoracion";
import { posicionEtiqueta } from "../oficina";
import { APARIENCIAS, COLORES_ESTADO, PALETA } from "../oficina/paleta";
import { crearMuros, crearPisos, plastico } from "./bloques3d";
import { COLORES_SALA } from "./identidad";
import { aleatorio, conRepeticion, texturaAlfombra } from "./materiales";
import { crearJardin, decorarLobby, amueblarSala } from "./mansion";
import { crearExterior, crearGaleria, crearLucesDePiso, crearPatio, crearRecepcion, crearTecho, decorarSala } from "./oficinas";
import { ALTURA_ATRIO, ALTURA_TECHO, ESCALA_CASA, type Jugador } from "./persona";
import { animarCuerpo, crearGente } from "./gente";
import { crearMarca } from "./marca";
import { apagarMunyeco, crearBebedero, crearEscritorio, crearMesaRedonda, crearMunyeco, crearObjeto, crearPlanta, crearSilla, type Munyeco } from "./figuras";
import { sprite, texturaCartelCentral, texturaCartelChico, texturaEtiqueta, texturaGlobito, texturaGuiones, texturaInsignia, texturaPizarra, texturaRotulo, texturaSigno } from "./texturas";

/** Cómo se mira el mundo: desde arriba, como una maqueta, o caminando por adentro. */
export type ModoDeVista = "arriba" | "persona";

export type Mundo3D = {
  escena: THREE.Scene;
  /** Cambia entre la vista desde arriba (paredes bajas, sin techo) y la de recorrer por adentro (techo y paredes completas). */
  ponerModo: (modo: ModoDeVista) => void;
  /** Dónde está la persona que recorre: se ve como un muñeco desde arriba. `null` lo esconde. */
  colocarJugador: (j: Jugador | null) => void;
  /** Dónde está cada persona de pie ahora (recepcionista, empleados): no se las puede atravesar. */
  personas: () => { x: number; z: number }[];
  /** Señala un lugar del plano con un marco amarillo que late (lo usa el recorrido explicado); `null` lo apaga. */
  marcar: (zona: { x: number; y: number; w: number; h: number } | null) => void;
  /** Pone el mundo al día con el juego. `t` son los segundos de animación (0 deja todo quieto). */
  actualizar: (agentes: readonly EstadoAgente[], brief: UbicacionBrief, t: number) => void;
  /** Libera la memoria de la tarjeta de video. */
  liberar: () => void;
};

const ALTURA_CARTEL = 215;
const Y_RUTA = 8;

type Papel = { grupo: THREE.Group; material: THREE.MeshStandardMaterial };

/** Una hoja con renglones. `(x, z)` es su centro sobre la superficie. */
function crearPapel(w: number, d: number): Papel {
  const grupo = new THREE.Group();
  const material = plastico(PALETA.papel, { roughness: 0.7, emissive: PALETA.resalte, emissiveIntensity: 0 });
  const hoja = new THREE.Mesh(new THREE.BoxGeometry(w, 3, d), material);
  hoja.castShadow = true;
  grupo.add(hoja);
  const linea = plastico("#b9bde0");
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w * (i === 2 ? 0.45 : 0.72), 0.8, d * 0.1), i === 0 ? plastico(PALETA.check) : linea);
    r.position.set(-w * 0.1, 1.9, -d * 0.28 + i * d * 0.26);
    grupo.add(r);
  }
  return { grupo, material };
}

const colocar = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T => {
  o.position.set(x, y, z);
  return o;
};

const centro = (r: { x: number; y: number; w: number; h: number }) => ({ x: r.x + r.w / 2, z: r.y + r.h / 2 });

export function construirMundo(): Mundo3D {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(PALETA.fondo);
  const raiz = new THREE.Group();
  escena.add(raiz);

  // luces: cielo suave y un sol que tira sombras
  const cielo = new THREE.HemisphereLight("#ffffff", "#8e94bd", 0.62);
  const ambiente = new THREE.AmbientLight("#fff3e0", 0);
  // el rebote del piso: la luz cálida que sube y golpea el techo. Es lo que evita que un interior se vea plano.
  const rebote = new THREE.HemisphereLight("#0b0e14", "#4d3c28", 0);
  escena.add(cielo, ambiente, rebote);
  const sol = new THREE.DirectionalLight("#fff4e0", 1.6);
  sol.position.set(MUNDO.ancho / 2 - 700, 1500, MUNDO.alto / 2 - 500);
  sol.target.position.set(MUNDO.ancho / 2, 0, MUNDO.alto / 2);
  sol.castShadow = true;
  sol.shadow.mapSize.set(4096, 4096);
  Object.assign(sol.shadow.camera, { left: -2400, right: 2400, top: 1700, bottom: -1700, near: 100, far: 4200 });
  sol.shadow.bias = -0.0006;
  sol.shadow.normalBias = 1.8;
  escena.add(sol, sol.target);

  crearExterior(raiz);
  crearPisos(raiz);
  const muros = crearMuros(raiz, ALTURA_TECHO);
  const techo = crearTecho(raiz, ALTURA_TECHO, ALTURA_ATRIO);
  crearRecepcion(raiz);
  crearPatio(raiz);
  // lo que solo se ve al caminar por adentro (techo alto, columnas, araña, cuadros, placas)
  const interior = new THREE.Group();
  interior.visible = false;
  raiz.add(interior);
  crearLucesDePiso(interior);
  crearGaleria(interior);
  SALAS.forEach((sala, i) => {
    decorarSala(raiz, interior, sala, i);
    amueblarSala(raiz, interior, sala, i);
  });

  // polvo suspendido en la luz del atrio: el detalle que hace que el aire "exista" al caminar
  const polvo = new THREE.Group();
  {
    const azar = aleatorio(13);
    const n = 220;
    const posiciones = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      posiciones[i * 3] = (azar() - 0.5) * (LOBBY.w - 220);
      posiciones[i * 3 + 1] = 24 + azar() * (ALTURA_ATRIO - 130);
      posiciones[i * 3 + 2] = (azar() - 0.5) * (LOBBY.h - 180);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
    const material = new THREE.PointsMaterial({ color: "#ffe6bd", size: 1.5, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending });
    const puntos = new THREE.Points(geo, material);
    puntos.frustumCulled = false;
    polvo.add(puntos);
    polvo.position.set(LOBBY.x + LOBBY.w / 2, 0, LOBBY.y + LOBBY.h / 2);
    polvo.visible = false;
    raiz.add(polvo);
  }
  const lobby = decorarLobby(raiz, interior);
  const jardin = crearJardin(raiz);
  const gente = crearGente(raiz);

  // ---- lobby: alfombra, cartel central y bebedero (los rincones de estar están en mansion.ts)
  const alfombra = { x: LOBBY.x + 150, y: LOBBY.y + 60, w: LOBBY.w - 300, h: LOBBY.h - 120 };
  const ca = centro(alfombra);
  raiz.add(colocar(new THREE.Mesh(new THREE.BoxGeometry(alfombra.w, 3, alfombra.h), new THREE.MeshStandardMaterial({ map: conRepeticion(texturaAlfombra(PALETA.alfombra), alfombra.w, alfombra.h, 90), roughness: 0.95 })), ca.x, 1.5, ca.z));
  const cartelCentral = new THREE.Mesh(
    new THREE.PlaneGeometry(CARTEL_CENTRAL.area.w, CARTEL_CENTRAL.area.h),
    new THREE.MeshBasicMaterial({ map: texturaCartelCentral(CARTEL_CENTRAL.titulo, CARTEL_CENTRAL.lema), transparent: true }),
  );
  const cc = centro(CARTEL_CENTRAL.area);
  cartelCentral.rotation.x = -Math.PI / 2;
  raiz.add(colocar(cartelCentral, cc.x, 10.5, cc.z));

  raiz.add(colocar(crearBebedero(), BEBEDERO.x + BEBEDERO.w / 2, 0, BEBEDERO.y + BEBEDERO.h - 20));
  for (const p of PLANTAS) raiz.add(colocar(crearPlanta(), p.x, 0, p.y));

  // ---- papelería: estantería, mesa con bandeja, brief y cartel
  const pa = PAPELERIA;
  raiz.add(colocar(crearObjeto("libros", ESTANTE_PAPELERIA.w).grupo, ESTANTE_PAPELERIA.x + ESTANTE_PAPELERIA.w / 2, 0, ESTANTE_PAPELERIA.y + 30));
  const mesa = { x: pa.x + 70, y: pa.y + 230, w: 280, h: 90 };
  const cm = centro(mesa);
  const patas = plastico(PALETA.maderaFrente, { roughness: 0.55 });
  raiz.add(colocar(new THREE.Mesh(new THREE.BoxGeometry(mesa.w, 56, mesa.h - 10), patas), cm.x, 28, cm.z));
  raiz.add(colocar(new THREE.Mesh(new THREE.BoxGeometry(mesa.w + 8, 6, mesa.h), plastico(PALETA.maderaTapa, { roughness: 0.5 })), cm.x, 59, cm.z));
  raiz.add(colocar(new THREE.Mesh(new THREE.BoxGeometry(150, 6, 70), plastico("#5a5f86")), cm.x, 65, cm.z));
  const rotuloPapeleria = sprite(texturaCartelChico("Papelería", "Dejá acá el brief"), 230, 58);
  raiz.add(colocar(rotuloPapeleria, pa.x + pa.w / 2 + 85, 70, pa.y - 34));

  const briefPapel = crearPapel(84, 58);
  raiz.add(briefPapel.grupo);

  // ---- las ocho salas
  type PuestoSala = {
    munyeco: Munyeco;
    pantallas: THREE.Texture[];
    pizarra: THREE.Texture;
    halo: THREE.Mesh;
    haloMat: THREE.MeshBasicMaterial;
    signo: THREE.Sprite;
    globito: THREE.Sprite;
    insignia: THREE.Sprite;
    etiqueta: THREE.Sprite;
    etiquetaEstado: EstadoAgente | null;
    documento: Papel;
    leds: THREE.MeshStandardMaterial[];
  };
  /** Los carteles de arriba de cada sala: sirven para mirar desde arriba y estorban al caminar por adentro. */
  const rotulos: THREE.Sprite[] = [];
  let caminando = false;
  const colegas: { m: Munyeco; indice: number; fase: number }[] = [];
  const puestos: PuestoSala[] = SALAS.map((sala: Sala, i) => {
    const textos = textosDe(AGENTES[i].id);
    const a = sala.area;
    const esVidrio = sala.tipo === "vidrio";
    const arriba = a.y < LOBBY.y;
    const { x: px, y: py } = sala.personaje;

    const pizarra = texturaPizarra(textos.pizarra);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(sala.pizarra.w, sala.pizarra.h), new THREE.MeshBasicMaterial({ map: pizarra, transparent: true }));
    const cp = centro(sala.pizarra);
    raiz.add(colocar(panel, cp.x, 118, a.y + 22));

    const objeto = OBJETOS_SALA.find((o) => o.sala === i);
    let leds: THREE.MeshStandardMaterial[] = [];
    if (objeto) {
      const o = crearObjeto(objeto.tipo, objeto.w);
      leds = o.leds;
      raiz.add(colocar(o.grupo, objeto.x + objeto.w / 2, 0, objeto.y + objeto.h - 20));
    }

    const silla = crearSilla();
    raiz.add(colocar(silla, px, 0, py + 20));
    const munyeco = crearMunyeco(i);
    raiz.add(colocar(munyeco.grupo, px, 0, py + 20));

    let pantallas: THREE.Texture[] = [];
    let halo = sala.escritorio;
    if (esVidrio) {
      for (const [k, c] of COLEGAS_REVIEW.entries()) {
        const dir = Math.atan2(MESA_REDONDA_REVIEW.x - c.x, MESA_REDONDA_REVIEW.y - c.y);
        const s = colocar(crearSilla(), c.x, 0, c.y);
        s.rotation.y = dir;
        raiz.add(s);
        const m = crearMunyeco(c.indice);
        colocar(m.grupo, c.x, 0, c.y).rotation.y = dir;
        raiz.add(m.grupo);
        colegas.push({ m, indice: c.indice, fase: k * 2.3 });
      }
      raiz.add(colocar(crearMesaRedonda(MESA_REDONDA_REVIEW.rx, MESA_REDONDA_REVIEW.ry), MESA_REDONDA_REVIEW.x, 0, MESA_REDONDA_REVIEW.y));
    } else {
      const e = crearEscritorio(sala.escritorio);
      pantallas = e.pantallas;
      raiz.add(e.grupo);
    }
    halo = { x: halo.x - 30, y: halo.y - 20, w: halo.w + 60, h: halo.h + 50 };

    const haloMat = new THREE.MeshBasicMaterial({ color: PALETA.resalte, transparent: true, opacity: 0, depthWrite: false });
    const haloMalla = new THREE.Mesh(new THREE.PlaneGeometry(halo.w, halo.h), haloMat);
    haloMalla.rotation.x = -Math.PI / 2;
    haloMalla.visible = false;
    const ch = centro(halo);
    raiz.add(colocar(haloMalla, ch.x, 17, ch.z));

    // el cartel con el nombre: arriba de la sala si da al pasillo de arriba, sobre el pasillo si no
    const alturaRotulo = arriba || esVidrio ? ALTURA_CARTEL : 175;
    const zRotulo = arriba ? a.y + 8 : esVidrio ? a.y + 40 : a.y - 46;
    const rotulo = sprite(texturaRotulo(sala.numero, textos.nombre, textos.subtitulo, COLORES_SALA[i]), 380, 74);
    rotulos.push(rotulo);
    raiz.add(colocar(rotulo, a.x + a.w / 2, alturaRotulo, zRotulo));
    const insignia = sprite(texturaInsignia(), 38, 38);
    raiz.add(colocar(insignia, a.x + a.w / 2 + 216, alturaRotulo, zRotulo));
    insignia.visible = false;

    const signo = sprite(texturaSigno(), 42, 42);
    raiz.add(colocar(signo, px + 92, 205, py));
    signo.visible = false;
    const globito = sprite(texturaGlobito(textos.globito), 262, 100);
    raiz.add(colocar(globito, px + 190, 215, py - 30));
    globito.visible = false;

    const re = posicionEtiqueta(sala);
    const etiqueta = sprite(texturaEtiqueta(textoEtiqueta(i), APARIENCIAS[i % APARIENCIAS.length].camisa, COLORES_ESTADO.gris), 150 * 1.15, re.h * 1.15);
    raiz.add(colocar(etiqueta, px, 215, py));

    const documento = crearPapel(44, 30);
    const rd = rectDocumento(sala);
    raiz.add(colocar(documento.grupo, rd.x + rd.w / 2, esVidrio ? 70 : 69, esVidrio ? rd.y + rd.h / 2 : sala.escritorio.y + sala.escritorio.h - 44));
    documento.grupo.visible = false;

    return { munyeco, pantallas, pizarra, halo: haloMalla, haloMat, signo, globito, insignia, etiqueta, etiquetaEstado: null, documento, leds };
  });

  // ---- ruta del brief
  const guiones = texturaGuiones();
  type Pieza = { tramo: THREE.Group; segmentos: THREE.MeshBasicMaterial[]; texturas: THREE.Texture[]; discos: THREE.MeshBasicMaterial; punta: THREE.MeshBasicMaterial; estado: EstadoTramo | null; papel: Papel };
  const tramos: Pieza[] = RUTA.map((tramo) => {
    const g = new THREE.Group();
    const segmentos: THREE.MeshBasicMaterial[] = [];
    const texturas: THREE.Texture[] = [];
    const discos = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true });
    const punta = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true });
    for (let k = 1; k < tramo.length; k++) {
      const a = tramo[k - 1];
      const b = tramo[k];
      const largo = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const tex = guiones.clone();
      tex.needsUpdate = true;
      tex.repeat.set(largo / 48, 1);
      texturas.push(tex);
      const mat = new THREE.MeshBasicMaterial({ map: tex, color: "#ffffff", transparent: true, depthWrite: false });
      segmentos.push(mat);
      const seg = new THREE.Group();
      seg.position.set((a.x + b.x) / 2, Y_RUTA, (a.y + b.y) / 2);
      seg.rotation.y = -ang;
      const cinta = new THREE.Mesh(new THREE.PlaneGeometry(largo, 10), mat);
      cinta.rotation.x = -Math.PI / 2;
      seg.add(cinta);
      g.add(seg);
      if (k < tramo.length - 1) {
        const d = new THREE.Mesh(new THREE.CircleGeometry(5.5, 14), discos);
        d.rotation.x = -Math.PI / 2;
        g.add(colocar(d, b.x, Y_RUTA, b.y));
      }
    }
    const fin = tramo[tramo.length - 1];
    const antes = tramo[tramo.length - 2];
    const flecha = new THREE.Mesh(new THREE.ConeGeometry(12, 24, 3), punta);
    flecha.rotation.z = -Math.PI / 2;
    const base = new THREE.Group();
    base.rotation.y = -Math.atan2(fin.y - antes.y, fin.x - antes.x);
    base.add(flecha);
    g.add(colocar(base, fin.x, Y_RUTA + 1, fin.y));
    raiz.add(g);
    const papel = crearPapel(26, 18);
    papel.grupo.visible = false;
    raiz.add(papel.grupo);
    return { tramo: g, segmentos, texturas, discos, punta, estado: null, papel };
  });

  const colorDeTramo = (e: EstadoTramo) => (e === "hecho" ? PALETA.check : e === "activo" ? PALETA.resalte : "#3c466e");

  function actualizar(agentes: readonly EstadoAgente[], brief: UbicacionBrief, t: number) {
    const pulso = 0.5 + 0.5 * Math.sin(t * 4);
    marca.actualizar(t);
    jardin.actualizar(t);
    gente.actualizar(t);
    if (polvo.visible) polvo.rotation.y = t * 0.02;
    for (const c of colegas) animarCuerpo(c.m, "habla-sentado", t, c.fase, c.indice);

    puestos.forEach((p, i) => {
      const estado = agentes[i] ?? "deshabilitado";
      const m = p.munyeco;
      animarCuerpo(m, estado === "corriendo" ? "teclea" : "quieto", t, i * 1.7, i);
      if (estado !== "corriendo") {
        // manos sobre el escritorio, mirando de a ratos a un costado
        m.brazoI.rotation.x = -0.62;
        m.brazoD.rotation.x = -0.62;
      }
      if (estado === "habilitado") {
        m.brazoD.rotation.z = 2.5 + Math.sin(t * 6) * 0.3;
        m.brazoD.rotation.x = 0;
      }
      apagarMunyeco(m, estado === "deshabilitado");

      for (const tex of p.pantallas) tex.offset.y = estado === "corriendo" ? (t * 0.5) % 1 : 0;
      for (const led of p.leds) led.emissiveIntensity = estado === "corriendo" ? 0.25 + 0.5 * Math.abs(Math.sin(t * 8 + i)) : 0.5;

      p.halo.visible = estado === "habilitado";
      p.haloMat.opacity = 0.18 + 0.18 * pulso;
      p.signo.visible = estado === "habilitado";
      p.signo.position.y = 235 + Math.sin(t * 5) * 9;
      p.globito.visible = estado === "corriendo";
      p.globito.scale.set(262, 100, 1).multiplyScalar((1 + (estado === "corriendo" ? Math.sin(t * 3) * 0.015 : 0)) * (caminando ? 0.45 : 1));
      p.insignia.visible = estado === "terminado" && !caminando;
      p.etiqueta.visible = !caminando;
      p.documento.grupo.visible = estado === "terminado";
      p.documento.material.emissiveIntensity = 0.08 + 0.22 * pulso;
      p.documento.grupo.position.y = 72 + pulso * 3;

      if (p.etiquetaEstado !== estado) {
        p.etiquetaEstado = estado;
        const material = p.etiqueta.material;
        material.map?.dispose();
        material.map = texturaEtiqueta(textoEtiqueta(i), APARIENCIAS[i % APARIENCIAS.length].camisa, COLORES_ESTADO[etiquetaDeEstado(estado).color]);
        material.needsUpdate = true;
      }
    });

    // el brief: sobre la mesa de la papelería, flotando para que se vea que hay que dejarlo, o en el escritorio de quien lo tiene
    const hoja = briefPapel.grupo;
    hoja.visible = true;
    if (brief === "mano") {
      colocar(hoja, cm.x, 120 + Math.sin(t * 3) * 8, cm.z - 4);
      hoja.scale.setScalar(1.15 + Math.sin(t * 4) * 0.07);
      briefPapel.material.emissiveIntensity = 0.28 + 0.2 * pulso;
    } else if (brief === "papeleria") {
      colocar(hoja, cm.x, 70, cm.z - 4);
      hoja.scale.setScalar(1);
      briefPapel.material.emissiveIntensity = 0;
    } else {
      const sala = SALAS[brief.agente];
      const rb = rectBrief(sala);
      colocar(hoja, rb.x + rb.w / 2, sala.tipo === "vidrio" ? 70 : 69, sala.tipo === "vidrio" ? rb.y + rb.h / 2 : sala.escritorio.y + sala.escritorio.h - 44);
      hoja.scale.setScalar(0.52);
      briefPapel.material.emissiveIntensity = 0;
    }

    tramos.forEach((tr, i) => {
      const e = estadoDeSegmento(i, agentes);
      if (tr.estado !== e) {
        tr.estado = e;
        const color = colorDeTramo(e);
        for (const mat of tr.segmentos) {
          mat.color.set(color);
          mat.opacity = e === "pendiente" ? 0.4 : 1;
          mat.map = e === "hecho" ? null : mat.map ?? null;
          mat.needsUpdate = true;
        }
        tr.discos.color.set(color);
        tr.discos.opacity = e === "pendiente" ? 0.4 : 1;
        tr.punta.color.set(color);
        tr.punta.opacity = e === "pendiente" ? 0.5 : 1;
      }
      for (const tex of tr.texturas) tex.offset.x = e === "activo" ? -t * 1.2 : 0;
      tr.papel.grupo.visible = e === "activo";
      if (e === "activo") {
        const q = puntoEnRuta(RUTA[i], (t * 0.15) % 1);
        colocar(tr.papel.grupo, q.x, 16 + Math.sin(t * 6) * 2, q.y);
        tr.papel.material.emissiveIntensity = 0.3 + 0.4 * pulso;
      }
    });
  }

  const marca = crearMarca(raiz);

  // la persona que recorre, vista desde arriba
  const marcador = new THREE.Group();
  const cuerpoMarcador = new THREE.Mesh(new THREE.CapsuleGeometry(18, 70, 6, 14), plastico("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.25 }));
  cuerpoMarcador.position.y = 62;
  cuerpoMarcador.castShadow = true;
  const cabezaMarcador = new THREE.Mesh(new THREE.SphereGeometry(17, 18, 14), plastico("#ffd54a"));
  cabezaMarcador.position.y = 132;
  const flecha = new THREE.Mesh(new THREE.ConeGeometry(14, 34, 3), new THREE.MeshBasicMaterial({ color: "#ffd54a" }));
  flecha.rotation.x = -Math.PI / 2;
  flecha.position.set(0, 4, -52);
  marcador.add(cuerpoMarcador, cabezaMarcador, flecha);
  marcador.visible = false;
  raiz.add(marcador);

  const sprites: THREE.Sprite[] = [];
  escena.traverse((o) => {
    if ((o as THREE.Sprite).isSprite) {
      const s = o as THREE.Sprite;
      if (s.userData.fijo) return; // los halos de luz no se achican al caminar
      s.userData.escala0 = s.scale.clone();
      sprites.push(s);
    }
  });

  // al agrandar la casa, las luces puntuales y el sol tienen que crecer con ella o todo queda a oscuras
  const puntuales: { luz: THREE.PointLight | THREE.SpotLight; intensidad: number; alcance: number }[] = [];
  raiz.traverse((o) => {
    if (o instanceof THREE.PointLight || o instanceof THREE.SpotLight) puntuales.push({ luz: o, intensidad: o.intensity, alcance: o.distance });
  });
  const solBase = { pos: sol.position.clone(), objetivo: sol.target.position.clone(), camara: { ...sol.shadow.camera } as { left: number; right: number; top: number; bottom: number; far: number } };

  function ponerModo(modo: ModoDeVista) {
    const dentro = modo === "persona";
    const k = dentro ? ESCALA_CASA : 1;
    raiz.scale.setScalar(k);
    for (const p of puntuales) {
      p.luz.intensity = p.intensidad * k * k;
      p.luz.distance = p.alcance * k;
    }
    sol.position.copy(solBase.pos).multiplyScalar(k);
    sol.target.position.copy(solBase.objetivo).multiplyScalar(k);
    Object.assign(sol.shadow.camera, { left: solBase.camara.left * k, right: solBase.camara.right * k, top: solBase.camara.top * k, bottom: solBase.camara.bottom * k, far: solBase.camara.far * k });
    sol.shadow.camera.updateProjectionMatrix();
    muros.corte.visible = !dentro;
    muros.completo.visible = dentro;
    techo.visible = dentro;
    interior.visible = dentro;
    polvo.visible = dentro;
    // adentro hay más luz pareja (los ambientes cerrados reciben poco cielo) y menos sol; los carteles dejan de verse a través de las paredes
    // adentro manda la luz de las lámparas: poca luz pareja y poco sol, para que se marquen los volúmenes
    // la casa está iluminada por luz pareja de día: nada de lámparas encendidas
    cielo.intensity = dentro ? 0.95 : 0.8;
    ambiente.intensity = dentro ? 0.42 : 0.15;
    rebote.intensity = dentro ? 0.18 : 0;
    sol.intensity = dentro ? 1.05 : 1.3;
    // niebla clara: da profundidad a los pasillos sin ensuciar el blanco
    escena.fog = dentro ? new THREE.Fog(PALETA.fondo, 1300 * k, 5600 * k) : null;
    caminando = dentro;
    for (const s of sprites) {
      s.material.depthTest = dentro;
      // de cerca los avisos («!», globitos) serían enormes: se achican; los carteles de arriba se esconden
      s.scale.copy(s.userData.escala0 as THREE.Vector3).multiplyScalar(dentro ? 0.45 / k : 1);
    }
    for (const r of rotulos) r.visible = !dentro;
    for (const p of puestos) p.etiqueta.visible = !dentro;
  }

  function colocarJugador(j: Jugador | null) {
    marcador.visible = j !== null;
    if (j) {
      marcador.position.set(j.x, 0, j.z);
      marcador.rotation.y = j.yaw;
    }
  }

  function liberar() {
    escena.traverse((o) => {
      const malla = o as THREE.Mesh;
      malla.geometry?.dispose();
      const materiales = Array.isArray(malla.material) ? malla.material : malla.material ? [malla.material] : [];
      for (const mat of materiales) {
        (mat as THREE.MeshBasicMaterial).map?.dispose();
        mat.dispose();
      }
    });
    sol.shadow.map?.dispose();
    lobby.liberar();
    guiones.dispose();
    gente.liberar();
    for (const c of colegas) {
      c.m.abiertos.dispose();
      c.m.cerrados.dispose();
    }
    for (const p of puestos) {
      p.munyeco.abiertos.dispose();
      p.munyeco.cerrados.dispose();
      p.pizarra.dispose();
    }
  }

  return { escena, ponerModo, colocarJugador, personas: gente.posiciones, marcar: marca.poner, actualizar, liberar };
}
