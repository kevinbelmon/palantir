import * as THREE from "three";
import type { Rect } from "../oficina";

/** Lo que usa el recorrido explicado para señalar un lugar: un marco amarillo que late sobre el piso y una flecha que rebota. */
export type Marca = {
  /** Señala ese pedazo del plano; `null` la apaga. */
  poner: (zona: Rect | null) => void;
  /** Hace latir el marco (`t` son los segundos de animación). */
  actualizar: (t: number) => void;
};

const AMARILLO = "#ffd54a";
const ALTURA_MARCO = 16;
const GROSOR = 8;

export function crearMarca(raiz: THREE.Group): Marca {
  const grupo = new THREE.Group();
  grupo.visible = false;
  raiz.add(grupo);

  const borde = new THREE.MeshBasicMaterial({ color: AMARILLO, transparent: true, opacity: 0.9, depthWrite: false });
  const relleno = new THREE.MeshBasicMaterial({ color: AMARILLO, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
  const punta = new THREE.MeshBasicMaterial({ color: AMARILLO });
  let piezas: THREE.Mesh[] = [];
  let flecha: THREE.Mesh | null = null;
  let actual: Rect | null = null;

  const vaciar = () => {
    for (const p of piezas) {
      grupo.remove(p);
      p.geometry.dispose();
    }
    piezas = [];
    flecha = null;
  };

  const agregar = (malla: THREE.Mesh) => {
    grupo.add(malla);
    piezas.push(malla);
    return malla;
  };

  function poner(zona: Rect | null) {
    vaciar();
    actual = zona;
    grupo.visible = zona !== null;
    if (!zona) return;
    const cx = zona.x + zona.w / 2;
    const cz = zona.y + zona.h / 2;
    const barra = (w: number, d: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 5, d), borde);
      m.position.set(x, ALTURA_MARCO, z);
      agregar(m);
    };
    barra(zona.w + GROSOR, GROSOR, cx, zona.y);
    barra(zona.w + GROSOR, GROSOR, cx, zona.y + zona.h);
    barra(GROSOR, zona.h + GROSOR, zona.x, cz);
    barra(GROSOR, zona.h + GROSOR, zona.x + zona.w, cz);
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(zona.w, zona.h), relleno);
    plano.rotation.x = -Math.PI / 2;
    plano.position.set(cx, ALTURA_MARCO - 3, cz);
    agregar(plano);
    flecha = new THREE.Mesh(new THREE.ConeGeometry(26, 56, 4), punta);
    flecha.rotation.x = Math.PI;
    flecha.position.set(cx, 250, cz);
    agregar(flecha);
  }

  function actualizarMarca(t: number) {
    if (!actual) return;
    const pulso = 0.5 + 0.5 * Math.sin(t * 3.2);
    relleno.opacity = 0.06 + 0.12 * pulso;
    borde.opacity = 0.65 + 0.3 * pulso;
    if (flecha) flecha.position.y = 235 + Math.sin(t * 3.2) * 22;
  }

  return { poner, actualizar: actualizarMarca };
}
