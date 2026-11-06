import { useEffect, useRef } from "react";
import type { EstadoAgente, UbicacionBrief } from "../flujo";
import {
  arrastrar,
  camaraAjustada,
  camaraEnSala,
  dibujarOficina,
  elementoEn,
  factorRueda,
  interpolarCamara,
  pantallaAMundo,
  SALAS,
  tiempoVisible,
  zoomEn,
  type Camara,
  type Elemento,
} from "../oficina";
import { ALTO_BARRA } from "./BarraSuperior";
import { ALTO_DOCK } from "./Dock";

/** Pedido de llevar la cámara a una sala. `vez` cambia en cada pedido, así se puede repetir el mismo. */
export type Enfoque = { indice: number; vez: number };

type Props = { agentes: readonly EstadoAgente[]; brief: UbicacionBrief; alElegir: (e: Elemento) => void; enfoque: Enfoque | null };

const DURACION_VIAJE_MS = 700;

/** El mapa de la oficina: se arrastra con el clic derecho, se acerca con la rueda y viaja a la sala elegida. */
export function Lienzo({ agentes, brief, alElegir, enfoque }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const vista = useRef({ agentes, brief });
  const elegir = useRef(alElegir);
  const camara = useRef<Camara | null>(null);
  const viaje = useRef<{ desde: Camara; hasta: Camara; inicio: number } | null>(null);
  const movida = useRef(false); // si la persona ya movió la cámara, no la reacomodamos al cambiar el tamaño
  // el bucle de dibujo lee siempre lo último; las referencias se actualizan después de cada render
  useEffect(() => {
    vista.current = { agentes, brief };
    elegir.current = alElegir;
  });

  // llevar la cámara a una sala (con un viaje suave, o de golpe si el sistema pide menos movimiento)
  useEffect(() => {
    const canvas = ref.current;
    if (!enfoque || !canvas) return;
    const tamano = { ancho: canvas.clientWidth, alto: canvas.clientHeight };
    const hasta = camaraEnSala(SALAS[enfoque.indice], tamano, ALTO_BARRA, ALTO_DOCK);
    const desde = camara.current ?? camaraAjustada(tamano.ancho, tamano.alto, ALTO_BARRA, ALTO_DOCK);
    movida.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camara.current = hasta;
      viaje.current = null;
    } else {
      viaje.current = { desde, hasta, inicio: performance.now() };
    }
  }, [enfoque]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const inicio = performance.now();
    let arrastrando = false;
    let ultimo = { x: 0, y: 0 };
    let inicioClic: { x: number; y: number } | null = null;
    // si el sistema pide menos movimiento, la oficina queda quieta
    const pideQuietud = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducido = pideQuietud.matches;
    const alCambiarQuietud = () => (reducido = pideQuietud.matches);
    pideQuietud.addEventListener("change", alCambiarQuietud);

    const tamano = () => ({ ancho: canvas.clientWidth, alto: canvas.clientHeight });

    const ajustar = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      if (!movida.current) camara.current = camaraAjustada(canvas.clientWidth, canvas.clientHeight, ALTO_BARRA, ALTO_DOCK);
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(canvas);

    const alBajar = (e: PointerEvent) => {
      if (e.button === 0) inicioClic = { x: e.clientX, y: e.clientY };
      if (e.button !== 2) return;
      arrastrando = true;
      viaje.current = null; // si la persona toma el control, el viaje se corta
      ultimo = { x: e.clientX, y: e.clientY };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura: el arrastre igual sigue mientras el mouse esté sobre el lienzo */
      }
      canvas.style.cursor = "grabbing";
    };
    const alMover = (e: PointerEvent) => {
      if (!arrastrando || !camara.current) return;
      camara.current = arrastrar(camara.current, e.clientX - ultimo.x, e.clientY - ultimo.y, tamano());
      ultimo = { x: e.clientX, y: e.clientY };
      movida.current = true;
    };
    const alSoltar = (e: PointerEvent) => {
      if (e.button === 0 && inicioClic && camara.current) {
        const lejos = Math.hypot(e.clientX - inicioClic.x, e.clientY - inicioClic.y) > 6;
        if (!lejos) {
          const caja = canvas.getBoundingClientRect();
          const punto = pantallaAMundo(camara.current, e.clientX - caja.left, e.clientY - caja.top);
          const elemento = elementoEn(punto.x, punto.y);
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
      camara.current = zoomEn(camara.current, factorRueda(e.deltaY), e.clientX - caja.left, e.clientY - caja.top, tamano());
      movida.current = true;
    };
    const sinMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointerdown", alBajar);
    canvas.addEventListener("pointermove", alMover);
    canvas.addEventListener("pointerup", alSoltar);
    canvas.addEventListener("wheel", alRodar, { passive: false });
    canvas.addEventListener("contextmenu", sinMenu);

    const bucle = (ahora: number) => {
      const { ancho, alto } = tamano();
      camara.current ??= camaraAjustada(ancho, alto, ALTO_BARRA, ALTO_DOCK);
      const v = viaje.current;
      if (v) {
        const k = (ahora - v.inicio) / DURACION_VIAJE_MS;
        camara.current = interpolarCamara(v.desde, v.hasta, k);
        if (k >= 1) viaje.current = null;
      }
      dibujarOficina(ctx, {
        ancho,
        alto,
        dpr: window.devicePixelRatio || 1,
        camara: camara.current,
        agentes: vista.current.agentes,
        brief: vista.current.brief,
        tiempo: tiempoVisible((ahora - inicio) / 1000, reducido),
      });
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
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-label="La oficina del modelo operativo: ocho salas, una por agente, alrededor de un lobby, y la papelería donde se deja el brief"
      style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
    />
  );
}
