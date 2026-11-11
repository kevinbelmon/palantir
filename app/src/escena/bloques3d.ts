import * as THREE from "three";
import { LOBBY, PAPELERIA, SALAS, MUNDO, tirasDeMuro, type Rect, type Sala } from "../oficina";
import { colorDePiso } from "./identidad";
import { conRepeticion, texturaBaldosas, texturaCemento, texturaParquet, texturaPiedra, texturaYeso } from "./materiales";
import { LADRILLO } from "./texturas";

export const PASO_TACO = 28;
const RADIO_TACO = 9;
const ALTO_TACO = 6;

/** El material de plástico brillante de los bloques. */
export function plastico(color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0, ...extra });
}

/** Muchos tacos en una sola pieza: uno por punto, apoyados sobre la altura `y`. */
export function tacosInstanciados(puntos: { x: number; y: number }[], y: number, material: THREE.Material, radio = RADIO_TACO, alto = ALTO_TACO): THREE.InstancedMesh {
  const malla = new THREE.InstancedMesh(new THREE.CylinderGeometry(radio, radio, alto, 14), material, Math.max(1, puntos.length));
  const m = new THREE.Matrix4();
  puntos.forEach((p, i) => malla.setMatrixAt(i, m.makeTranslation(p.x, y + alto / 2, p.y)));
  malla.count = puntos.length;
  malla.instanceMatrix.needsUpdate = true;
  malla.receiveShadow = true;
  malla.castShadow = false;
  return malla;
}

/** Una caja cuyas coordenadas de textura siguen el tamaño: así los ladrillos miden siempre lo mismo. */
export function geometriaDeLadrillos(w: number, h: number, d: number): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  const escalas: [number, number][] = [
    [d / LADRILLO.ancho, h / LADRILLO.alto], // +x
    [d / LADRILLO.ancho, h / LADRILLO.alto], // -x
    [w / LADRILLO.ancho, d / LADRILLO.ancho], // +y
    [w / LADRILLO.ancho, d / LADRILLO.ancho], // -y
    [w / LADRILLO.ancho, h / LADRILLO.alto], // +z
    [w / LADRILLO.ancho, h / LADRILLO.alto], // -z
  ];
  for (let i = 0; i < uv.count; i++) {
    const [su, sv] = escalas[Math.floor(i / 4)];
    uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  }
  uv.needsUpdate = true;
  return g;
}

const caja = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

/** Los pisos del edificio: parquet en las oficinas y la papelería, mármol en el lobby y cemento pulido en los pasillos. */
export function crearPisos(raiz: THREE.Group): { liberar: () => void } {
  const texturas: THREE.Texture[] = [];
  const nueva = (t: THREE.Texture) => (texturas.push(t), t);
  const parquet = nueva(texturaParquet("#5c3f2a"));
  const baldosas = nueva(texturaBaldosas());
  const cemento = nueva(texturaCemento());

  const piso = (r: Rect, grosor: number, y: number, base: THREE.Texture, escala: number, extra: Partial<THREE.MeshStandardMaterialParameters>, tinte = "#ffffff") => {
    const mapa = nueva(conRepeticion(base, r.w, r.h, escala));
    const mat = new THREE.MeshStandardMaterial({ map: mapa, color: tinte, ...extra });
    raiz.add(caja(r.w, grosor, r.h, mat, r.x + r.w / 2, y, r.y + r.h / 2));
  };

  const losa: Rect = { x: 60, y: 60, w: MUNDO.ancho - 120, h: MUNDO.alto - 120 };
  piso(losa, 40, -20.5, cemento, 300, { roughness: 0.7 }, "#5a5d68");

  // el piso de cada oficina lleva un toque del color de su agente
  SALAS.forEach((s, i) => piso(s.area, 20, -10, parquet, 160, { roughness: 0.42 }, colorDePiso(i)));
  piso(LOBBY, 20, -10, baldosas, 300, { roughness: 0.2 }, "#6b6e7c");
  piso(PAPELERIA, 20, -10, parquet, 160, { roughness: 0.42 });
  return { liberar: () => texturas.forEach((t) => t.dispose()) };
}

const ALTURA = { norte: 170, sur: 40, oeste: 110, este: 110 } as const;

/**
 * Paredes pintadas con zócalo; la sala de vidrio tiene paredes transparentes. Se arman dos juegos: el «de corte»
 * (bajas, para mirar desde arriba) y el «completo» (a la altura del techo, para recorrer por adentro).
 */
export function crearMuros(raiz: THREE.Group, alturaCompleta: number): { corte: THREE.Group; completo: THREE.Group; liberar: () => void } {
  const yeso = texturaYeso("#2c2f3a");
  const matPared = new THREE.MeshStandardMaterial({ map: yeso, roughness: 0.88 });
  const piedra = texturaPiedra();
  const matPiedra = new THREE.MeshStandardMaterial({ map: piedra, color: "#6a6f80", roughness: 0.9 });
  const matZocalo = plastico("#12131a", { roughness: 0.45 });
  const matVidrio = new THREE.MeshStandardMaterial({ color: "#bfe1f5", transparent: true, opacity: 0.22, roughness: 0.08, metalness: 0, depthWrite: false });

  const puertaDe = (s: Sala): "abajo" | "arriba" | "izquierda" => (s.tipo === "vidrio" ? "izquierda" : s.area.y < LOBBY.y ? "abajo" : "arriba");
  const cerramientos: [Rect, "abajo" | "arriba" | "izquierda", boolean][] = [...SALAS.map((s): [Rect, "abajo" | "arriba" | "izquierda", boolean] => [s.area, puertaDe(s), s.tipo === "vidrio"]), [PAPELERIA, "arriba", false]];
  const borde = 22;
  const perimetro = [
    { x: 60 - borde, y: 60 - borde, w: MUNDO.ancho - 120 + borde * 2, h: borde },
    { x: 60 - borde, y: MUNDO.alto - 60, w: MUNDO.ancho - 120 + borde * 2, h: borde },
    { x: 60 - borde, y: 60, w: borde, h: MUNDO.alto - 120 },
    { x: MUNDO.ancho - 60, y: 60, w: borde, h: MUNDO.alto - 120 },
  ];

  const armar = (completo: boolean): THREE.Group => {
    const grupo = new THREE.Group();
    const muro = (r: Rect, alto: number, material: THREE.Material) => {
      const m = new THREE.Mesh(geometriaDeLadrillos(r.w, alto, r.h), material);
      m.position.set(r.x + r.w / 2, alto / 2, r.y + r.h / 2);
      m.castShadow = material === matPared || material === matPiedra;
      m.receiveShadow = true;
      grupo.add(m);
      if (material === matPared && alto > 60) grupo.add(caja(r.w + 3, 10, r.h + 3, matZocalo, r.x + r.w / 2, 5, r.y + r.h / 2));
      // moldura de yeso en el borde del techo, solo al recorrer por adentro
      if (completo && material !== matVidrio) grupo.add(caja(r.w + 5, 9, r.h + 5, matZocalo, r.x + r.w / 2, alto - 4.5, r.y + r.h / 2));
    };
    for (const [area, puerta, esVidrio] of cerramientos) {
      for (const t of tirasDeMuro(area, puerta, 16)) {
        const vidrio = esVidrio && t.lado !== "norte";
        muro(t.rect, completo ? alturaCompleta : ALTURA[t.lado], vidrio ? matVidrio : matPared);
      }
    }
    for (const r of perimetro) muro(r, completo ? alturaCompleta : 36, matPiedra);
    raiz.add(grupo);
    return grupo;
  };

  const corte = armar(false);
  const completo = armar(true);
  completo.visible = false;

  return {
    corte,
    completo,
    liberar: () => {
      yeso.dispose();
      piedra.dispose();
    },
  };
}
