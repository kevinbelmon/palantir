import * as THREE from "three";
import { LOBBY, PAPELERIA, SALAS, MUNDO, tacosEn, tirasDeMuro, type Rect, type Sala } from "../oficina";
import { PALETA } from "../oficina/paleta";
import { LADRILLO, texturaLadrillos } from "./texturas";

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

const dentro = (r: Rect, x: number, y: number, margen = 0) => x > r.x - margen && x < r.x + r.w + margen && y > r.y - margen && y < r.y + r.h + margen;

/** La placa gris de bloques: el suelo del edificio, los pisos de las salas y el lobby, con sus tacos. */
export function crearPisos(raiz: THREE.Group): void {
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(9000, 6000), new THREE.MeshStandardMaterial({ color: PALETA.fondo, roughness: 1 }));
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.set(MUNDO.ancho / 2, -40, MUNDO.alto / 2);
  suelo.receiveShadow = true;
  raiz.add(suelo);

  const losa: Rect = { x: 60, y: 60, w: MUNDO.ancho - 120, h: MUNDO.alto - 120 };
  const matLosa = plastico(PALETA.edificio, { roughness: 0.5 });
  raiz.add(caja(losa.w, 40, losa.h, matLosa, losa.x + losa.w / 2, -20.5, losa.y + losa.h / 2));

  const zonas: { r: Rect; color: string }[] = [
    ...SALAS.map((s) => ({ r: s.area, color: PALETA.sueloSala })),
    { r: LOBBY, color: PALETA.sueloLobby },
    { r: PAPELERIA, color: PALETA.sueloSala },
  ];
  for (const { r, color } of zonas) {
    const mat = plastico(color, { roughness: 0.45 });
    raiz.add(caja(r.w, 20, r.h, mat, r.x + r.w / 2, -10, r.y + r.h / 2));
    const matTaco = plastico(color, { roughness: 0.32 });
    raiz.add(tacosInstanciados(tacosEn(r, PASO_TACO), 0, matTaco));
  }

  // tacos de los pasillos (donde no hay sala, lobby ni papelería)
  const pasillos = tacosEn(losa, PASO_TACO).filter((p) => !zonas.some(({ r }) => dentro(r, p.x, p.y, 10)));
  raiz.add(tacosInstanciados(pasillos, 0, plastico(PALETA.edificio, { roughness: 0.32 })));
}

const ALTURA = { norte: 170, sur: 40, oeste: 110, este: 110 } as const;

/** Paredes de ladrillos blancos con tacos arriba; la sala de vidrio tiene paredes transparentes. */
export function crearMuros(raiz: THREE.Group): { liberar: () => void } {
  const texLadrillos = texturaLadrillos();
  const matLadrillo = plastico("#ffffff", { map: texLadrillos, roughness: 0.42 });
  const matVidrio = new THREE.MeshStandardMaterial({ color: "#bfe1f5", transparent: true, opacity: 0.22, roughness: 0.08, metalness: 0, depthWrite: false });
  const matTaco = plastico("#ffffff", { roughness: 0.3 });
  const tacosDeArriba: { x: number; y: number; alto: number }[] = [];

  const muro = (rect: Rect, alto: number, material: THREE.Material, conTacos: boolean) => {
    const m = new THREE.Mesh(geometriaDeLadrillos(rect.w, alto, rect.h), material);
    m.position.set(rect.x + rect.w / 2, alto / 2, rect.y + rect.h / 2);
    m.castShadow = material === matLadrillo;
    m.receiveShadow = true;
    raiz.add(m);
    if (conTacos) for (const p of tacosEn(rect, 16)) tacosDeArriba.push({ x: p.x, y: p.y, alto });
  };

  const puertaDe = (s: Sala): "abajo" | "arriba" | "izquierda" => (s.tipo === "vidrio" ? "izquierda" : s.area.y < LOBBY.y ? "abajo" : "arriba");
  const cerramientos: [Rect, "abajo" | "arriba" | "izquierda", boolean][] = [...SALAS.map((s): [Rect, "abajo" | "arriba" | "izquierda", boolean] => [s.area, puertaDe(s), s.tipo === "vidrio"]), [PAPELERIA, "arriba", false]];
  for (const [area, puerta, esVidrio] of cerramientos) {
    for (const t of tirasDeMuro(area, puerta, 16)) {
      const vidrio = esVidrio && t.lado !== "norte";
      muro(t.rect, ALTURA[t.lado], vidrio ? matVidrio : matLadrillo, !vidrio);
    }
  }

  // borde bajo alrededor de todo el edificio
  const borde = 22;
  const b = [
    { x: 60 - borde, y: 60 - borde, w: MUNDO.ancho - 120 + borde * 2, h: borde },
    { x: 60 - borde, y: MUNDO.alto - 60, w: MUNDO.ancho - 120 + borde * 2, h: borde },
    { x: 60 - borde, y: 60, w: borde, h: MUNDO.alto - 120 },
    { x: MUNDO.ancho - 60, y: 60, w: borde, h: MUNDO.alto - 120 },
  ];
  for (const r of b) muro(r, 36, matLadrillo, true);

  // los tacos de arriba de las paredes, agrupados por altura
  const alturas = [...new Set(tacosDeArriba.map((t) => t.alto))];
  for (const alto of alturas) {
    raiz.add(tacosInstanciados(tacosDeArriba.filter((t) => t.alto === alto), alto, matTaco, 5.5, 5));
  }

  return {
    liberar: () => {
      texLadrillos.dispose();
    },
  };
}

