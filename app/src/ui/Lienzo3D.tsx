import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { EstadoAgente, UbicacionBrief } from "../flujo";
import { elementoEn, factorRueda, SALAS, tiempoVisible, type Elemento } from "../oficina";
import {
  arrastrar3d,
  camara3dEnSala,
  camara3dInicial,
  construirMundo,
  FOV_VERTICAL,
  interpolar3d,
  pantallaAPlano,
  posicionDeCamara,
  zoom3d,
  type Camara3D,
} from "../escena";
import { ALTO_BARRA } from "./BarraSuperior";
import { ALTO_DOCK } from "./Dock";
import type { Enfoque } from "./Lienzo";

type Props = { agentes: readonly EstadoAgente[]; brief: UbicacionBrief; alElegir: (e: Elemento) => void; enfoque: Enfoque | null };

const DURACION_VIAJE_MS = 700;

/** La oficina en 3D: la misma interacción que el mapa plano (clic derecho para mover, rueda para acercar, clic para elegir). */
export function Lienzo3D({ agentes, brief, alElegir, enfoque }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const vista = useRef({ agentes, brief });
  const elegir = useRef(alElegir);
  const camara = useRef<Camara3D | null>(null);
  const viaje = useRef<{ desde: Camara3D; hasta: Camara3D; inicio: number } | null>(null);
  const movida = useRef(false);
  useEffect(() => {
    vista.current = { agentes, brief };
    elegir.current = alElegir;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!enfoque || !canvas) return;
    const tamano = { ancho: canvas.clientWidth, alto: canvas.clientHeight };
    const hasta = camara3dEnSala(SALAS[enfoque.indice], tamano, ALTO_BARRA, ALTO_DOCK);
    const desde = camara.current ?? camara3dInicial(tamano, ALTO_BARRA, ALTO_DOCK);
    movida.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camara.current = hasta;
      viaje.current = null;
    } else viaje.current = { desde, hasta, inicio: performance.now() };
  }, [enfoque]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const mundo = construirMundo();
    const lente = new THREE.PerspectiveCamera((FOV_VERTICAL * 180) / Math.PI, 1, 20, 30000);

    let raf = 0;
    const inicio = performance.now();
    let arrastrando = false;
    let ultimo = { x: 0, y: 0 };
    let inicioClic: { x: number; y: number } | null = null;
    const pideQuietud = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducido = pideQuietud.matches;
    const alCambiarQuietud = () => (reducido = pideQuietud.matches);
    pideQuietud.addEventListener("change", alCambiarQuietud);

    const tamano = () => ({ ancho: canvas.clientWidth, alto: canvas.clientHeight });

    const ajustar = () => {
      const { ancho, alto } = tamano();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(ancho, alto, false);
      lente.aspect = ancho / Math.max(1, alto);
      lente.updateProjectionMatrix();
      if (!movida.current) camara.current = camara3dInicial({ ancho, alto }, ALTO_BARRA, ALTO_DOCK);
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(canvas);

    const alBajar = (e: PointerEvent) => {
      if (e.button === 0) inicioClic = { x: e.clientX, y: e.clientY };
      if (e.button !== 2) return;
      arrastrando = true;
      viaje.current = null;
      ultimo = { x: e.clientX, y: e.clientY };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura: el arrastre sigue mientras el mouse esté sobre el lienzo */
      }
      canvas.style.cursor = "grabbing";
    };
    const alMover = (e: PointerEvent) => {
      if (!arrastrando || !camara.current) return;
      const caja = canvas.getBoundingClientRect();
      camara.current = arrastrar3d(camara.current, e.clientX - ultimo.x, e.clientY - ultimo.y, tamano(), ultimo.x - caja.left, ultimo.y - caja.top);
      ultimo = { x: e.clientX, y: e.clientY };
      movida.current = true;
    };
    const alSoltar = (e: PointerEvent) => {
      if (e.button === 0 && inicioClic && camara.current) {
        const lejos = Math.hypot(e.clientX - inicioClic.x, e.clientY - inicioClic.y) > 6;
        if (!lejos) {
          const caja = canvas.getBoundingClientRect();
          const punto = pantallaAPlano(camara.current, tamano(), e.clientX - caja.left, e.clientY - caja.top);
          // el piso que se ve "detrás" de un muñeco o un objeto alto queda más al norte: se prueba también un poco más al sur
          const elemento = punto ? [0, 70, 130].reduce<Elemento | null>((hallado, sur) => hallado ?? elementoEn(punto.x, punto.z + sur), null) : null;
          if (elemento) elegir.current(elemento);
        }
        inicioClic = null;
      }
      if (e.button !== 2) return;
      arrastrando = false;
      canvas.style.cursor = "";
    };
    const alRodar = (e: WheelEvent) => {
      e.preventDefault();
      if (!camara.current) return;
      viaje.current = null;
      const caja = canvas.getBoundingClientRect();
      // factorRueda > 1 acerca (como en el mapa plano); acá la distancia baja al acercar
      camara.current = zoom3d(camara.current, 1 / factorRueda(e.deltaY), tamano(), e.clientX - caja.left, e.clientY - caja.top);
      movida.current = true;
    };
    const sinMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointerdown", alBajar);
    canvas.addEventListener("pointermove", alMover);
    canvas.addEventListener("pointerup", alSoltar);
    canvas.addEventListener("wheel", alRodar, { passive: false });
    canvas.addEventListener("contextmenu", sinMenu);

    const bucle = (ahora: number) => {
      const t = tamano();
      camara.current ??= camara3dInicial(t, ALTO_BARRA, ALTO_DOCK);
      const v = viaje.current;
      if (v) {
        const k = (ahora - v.inicio) / DURACION_VIAJE_MS;
        camara.current = interpolar3d(v.desde, v.hasta, k);
        if (k >= 1) viaje.current = null;
      }
      const c = camara.current;
      const pos = posicionDeCamara(c);
      lente.position.set(pos.x, pos.y, pos.z);
      lente.lookAt(c.x, 0, c.z);
      mundo.actualizar(vista.current.agentes, vista.current.brief, tiempoVisible((ahora - inicio) / 1000, reducido));
      renderer.render(mundo.escena, lente);
      raf = requestAnimationFrame(bucle);
    };
    raf = requestAnimationFrame(bucle);

    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
      pideQuietud.removeEventListener("change", alCambiarQuietud);
      canvas.removeEventListener("pointerdown", alBajar);
      canvas.removeEventListener("pointermove", alMover);
      canvas.removeEventListener("pointerup", alSoltar);
      canvas.removeEventListener("wheel", alRodar);
      canvas.removeEventListener("contextmenu", sinMenu);
      mundo.liberar();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-label="La oficina del modelo operativo en 3D: ocho salas, una por agente, alrededor de un lobby, y la papelería donde se deja el brief"
      style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
    />
  );
}
