import { useEffect, useRef } from "react";
import type { EstadoAgente, UbicacionBrief } from "../flujo";
import { arrastrar, camaraAjustada, dibujarOficina, elementoEn, factorRueda, pantallaAMundo, zoomEn, type Camara, type Elemento } from "../oficina";

type Props = { agentes: readonly EstadoAgente[]; brief: UbicacionBrief; alElegir: (e: Elemento) => void };

/** El mapa de la oficina: se arrastra con el clic derecho y se acerca o aleja con la rueda. */
export function Lienzo({ agentes, brief, alElegir }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const vista = useRef({ agentes, brief });
  const elegir = useRef(alElegir);
  // el bucle de dibujo lee siempre lo último; las referencias se actualizan después de cada render
  useEffect(() => {
    vista.current = { agentes, brief };
    elegir.current = alElegir;
  });

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const inicio = performance.now();
    let camara: Camara | null = null;
    let movida = false; // si la persona ya movió la cámara, no la reacomodamos al cambiar el tamaño
    let arrastrando = false;
    let ultimo = { x: 0, y: 0 };
    let inicioClic: { x: number; y: number } | null = null;

    const tamano = () => ({ ancho: canvas.clientWidth, alto: canvas.clientHeight });

    const ajustar = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      if (!movida) camara = camaraAjustada(canvas.clientWidth, canvas.clientHeight);
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(canvas);

    const alBajar = (e: PointerEvent) => {
      if (e.button === 0) inicioClic = { x: e.clientX, y: e.clientY };
      if (e.button !== 2) return;
      arrastrando = true;
      ultimo = { x: e.clientX, y: e.clientY };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura: el arrastre igual sigue mientras el mouse esté sobre el lienzo */
      }
      canvas.style.cursor = "grabbing";
    };
    const alMover = (e: PointerEvent) => {
      if (!arrastrando || !camara) return;
      camara = arrastrar(camara, e.clientX - ultimo.x, e.clientY - ultimo.y, tamano());
      ultimo = { x: e.clientX, y: e.clientY };
      movida = true;
    };
    const alSoltar = (e: PointerEvent) => {
      if (e.button === 0 && inicioClic && camara) {
        const lejos = Math.hypot(e.clientX - inicioClic.x, e.clientY - inicioClic.y) > 6;
        if (!lejos) {
          const caja = canvas.getBoundingClientRect();
          const punto = pantallaAMundo(camara, e.clientX - caja.left, e.clientY - caja.top);
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
      if (!camara) return;
      const caja = canvas.getBoundingClientRect();
      camara = zoomEn(camara, factorRueda(e.deltaY), e.clientX - caja.left, e.clientY - caja.top, tamano());
      movida = true;
    };
    const sinMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointerdown", alBajar);
    canvas.addEventListener("pointermove", alMover);
    canvas.addEventListener("pointerup", alSoltar);
    canvas.addEventListener("wheel", alRodar, { passive: false });
    canvas.addEventListener("contextmenu", sinMenu);

    const bucle = (ahora: number) => {
      const { ancho, alto } = tamano();
      camara ??= camaraAjustada(ancho, alto);
      dibujarOficina(ctx, {
        ancho,
        alto,
        dpr: window.devicePixelRatio || 1,
        camara,
        agentes: vista.current.agentes,
        brief: vista.current.brief,
        tiempo: (ahora - inicio) / 1000,
      });
      raf = requestAnimationFrame(bucle);
    };
    raf = requestAnimationFrame(bucle);

    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
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
