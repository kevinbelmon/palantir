import { useEffect, useRef } from "react";
import type { EstadoAgente, UbicacionBrief } from "../flujo";
import { camaraAjustada, dibujarOficina } from "../oficina";

type Props = { agentes: readonly EstadoAgente[]; brief: UbicacionBrief };

/** El mapa de la oficina, dibujado en un lienzo que ocupa toda la ventana. */
export function Lienzo({ agentes, brief }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const vista = useRef({ agentes, brief });
  vista.current = { agentes, brief };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const inicio = performance.now();

    const ajustar = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(canvas);

    const bucle = (ahora: number) => {
      const ancho = canvas.clientWidth;
      const alto = canvas.clientHeight;
      dibujarOficina(ctx, {
        ancho,
        alto,
        dpr: window.devicePixelRatio || 1,
        camara: camaraAjustada(ancho, alto),
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
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-label="La oficina del modelo operativo: ocho salas, una por agente, alrededor de un lobby, y la papelería donde se deja el brief"
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
