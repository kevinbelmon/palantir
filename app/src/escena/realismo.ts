import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Lo que separa una maqueta de bloques de una foto de una casa: los objetos apoyan en el piso (sombra de
// contacto), las superficies tienen relieve (mapa de normales) y las lámparas tienen su halo. Todo dibujado
// en un lienzo 2D, sin imágenes externas.

/** Relieve a partir del dibujo de una textura: lee el gris de cada píxel y arma un mapa de normales. */
function mapaDeRelieve(lienzoFuente: HTMLCanvasElement, fuerza: number): THREE.DataTexture {
  const S = Math.min(256, lienzoFuente.width);
  const l = document.createElement("canvas");
  l.width = S;
  l.height = S;
  const ctx = l.getContext("2d");
  if (!ctx) throw new Error("No se pudo leer la textura");
  ctx.drawImage(lienzoFuente, 0, 0, S, S);
  const datos = ctx.getImageData(0, 0, S, S).data;
  const altura = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const p = i * 4;
    altura[i] = (0.2126 * datos[p] + 0.7152 * datos[p + 1] + 0.0722 * datos[p + 2]) / 255;
  }
  const salida = new Uint8Array(S * S * 4);
  const en = (x: number, y: number) => altura[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = -(en(x + 1, y) - en(x - 1, y)) * fuerza;
      const ny = -(en(x, y + 1) - en(x, y - 1)) * fuerza;
      const largo = Math.hypot(nx, ny, 1);
      const i = (y * S + x) * 4;
      salida[i] = ((nx / largo) * 0.5 + 0.5) * 255;
      salida[i + 1] = ((ny / largo) * 0.5 + 0.5) * 255;
      salida[i + 2] = ((1 / largo) * 0.5 + 0.5) * 255;
      salida[i + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(salida, S, S);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

const relieves = new WeakMap<HTMLCanvasElement, Map<number, THREE.DataTexture>>();

/**
 * El relieve de una textura ya creada. Comparte el dibujo con la textura de color y copia su repetición,
 * así el grano de la madera o del cemento no se estira cuando el material se repite muchas veces.
 */
export function relieveDe(base: THREE.Texture, fuerza = 2): THREE.DataTexture {
  const fuente = (base as THREE.CanvasTexture).image as HTMLCanvasElement;
  let porFuerza = relieves.get(fuente);
  if (!porFuerza) {
    porFuerza = new Map();
    relieves.set(fuente, porFuerza);
  }
  let plantilla = porFuerza.get(fuerza);
  if (!plantilla) {
    plantilla = mapaDeRelieve(fuente, fuerza);
    porFuerza.set(fuerza, plantilla);
  }
  const t = plantilla.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.copy(base.repeat);
  t.needsUpdate = true;
  return t;
}

/** Una mancha oscura y difusa, del tamaño de un objeto, que lo hace apoyar en el piso. */
function texturaMancha(): THREE.CanvasTexture {
  const T = 128;
  const c = document.createElement("canvas");
  c.width = T;
  c.height = T;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
    g.addColorStop(0, "rgba(0,0,0,0.85)");
    g.addColorStop(0.45, "rgba(0,0,0,0.5)");
    g.addColorStop(0.75, "rgba(0,0,0,0.16)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, T, T);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let manchaCompartida: THREE.Texture | null = null;

/**
 * La sombra de contacto: un óvalo oscuro apenas levantado del piso. Es el truco que más cambia la lectura
 * de una escena, porque sin él todo parece flotar. `fuerza` va de 0 a 1.
 */
export function manchaDeContacto(padre: THREE.Object3D, x: number, z: number, ancho: number, fondo: number, fuerza = 0.5, y = 0.9): THREE.Mesh {
  manchaCompartida ??= texturaMancha();
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, fondo),
    new THREE.MeshBasicMaterial({
      map: manchaCompartida,
      transparent: true,
      opacity: fuerza,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.renderOrder = 1;
  padre.add(m);
  return m;
}

/** El resplandor alrededor de una lámpara encendida: un degradado aditivo, no una esfera opaca. */
function texturaHalo(): THREE.CanvasTexture {
  const T = 128;
  const c = document.createElement("canvas");
  c.width = T;
  c.height = T;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.18, "rgba(255,255,255,0.42)");
    g.addColorStop(0.45, "rgba(255,255,255,0.11)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, T, T);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let haloCompartido: THREE.Texture | null = null;

/** Un halo de luz para colgar de una lámpara. No se encoge al caminar: se marca como fijo. */
export function haloDeLuz(color: string, tam: number, fuerza = 0.55): THREE.Sprite {
  haloCompartido ??= texturaHalo();
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloCompartido, color, transparent: true, opacity: fuerza, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(tam);
  s.userData.fijo = true;
  return s;
}

/** Una caja con los bordes redondeados: es lo que hace que un mueble no se lea como un cubo. */
export function geoRedonda(w: number, h: number, d: number, radio: number): THREE.BufferGeometry {
  const r = Math.min(radio, Math.min(w, h, d) / 2 - 0.05);
  return new RoundedBoxGeometry(w, h, d, 2, Math.max(0.5, r));
}

/** La misma caja redondeada, ya montada con su material y sus sombras. */
export function cajaRedonda(w: number, h: number, d: number, radio: number, material: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geoRedonda(w, h, d, radio), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Tela: mate, con un brillo apenas en el borde del tejido. Mucho más creíble que un plástico liso. */
export function tela(color: string, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.94, metalness: 0, sheen: 0.6, sheenRoughness: 0.85, sheenColor: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.25), ...extra });
}

/** Superficie pulida (mármol, piedra, laca): una capa fina de barniz que refleja las luces. */
export function pulido(color: string, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.28, ...extra });
}

/** Libera las texturas compartidas de este módulo (al desmontar la escena). */
export function liberarRealismo(): void {
  manchaCompartida?.dispose();
  haloCompartido?.dispose();
  manchaCompartida = null;
  haloCompartido = null;
}
