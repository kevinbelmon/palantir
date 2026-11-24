import { useCallback, useEffect, useMemo, useState } from "react";
import { construirGuion, duracionTotal, vistaEn, zonaDeSala, type VistaDemo } from "../flujo/guionDemo";

// El reloj de la demo: estado, tiempos y atajos de teclado. Vive aparte de los componentes para que
// el archivo de la demo solo tenga dibujo (y para no romper el refresco en caliente).

/** Cómo se pidió la demo en la dirección: `?demo=1&velocidad=1.5&auto=0`. */
export type ParametrosDeDemo = { activo: boolean; velocidad: number; iniciarSolo: boolean };

export function leerParametrosDeDemo(busqueda: string): ParametrosDeDemo {
  const p = new URLSearchParams(busqueda);
  const crudo = Number.parseFloat(p.get("velocidad") ?? "1");
  const velocidad = Number.isFinite(crudo) && crudo > 0 ? Math.min(4, Math.max(0.25, crudo)) : 1;
  return { activo: p.get("demo") === "1", velocidad, iniciarSolo: p.get("auto") !== "0" };
}

/** Las velocidades que se pueden elegir con el botón o con las flechas. */
export const VELOCIDADES = [0.5, 0.75, 1, 1.5, 2] as const;

export type Demo = {
  activo: boolean;
  empezo: boolean;
  pausada: boolean;
  detenida: boolean;
  velocidad: number;
  vista: VistaDemo;
  /** Cuánto dura la corrida completa, a velocidad 1. */
  total: number;
  /** En qué instante está, en milisegundos del guion. */
  tiempo: number;
  enfoque: VistaDemo["enfoque"];
  empezar: () => void;
  detener: () => void;
  alternarPausa: () => void;
  cambiarVelocidad: (v: number) => void;
  reiniciar: () => void;
};

/** El reloj en formato `2:35`. */
export function reloj(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const velocidadMasCercana = (v: number, paso: number): number => {
  const i = VELOCIDADES.findIndex((x) => x >= v - 0.001);
  const desde = i === -1 ? VELOCIDADES.length - 1 : i;
  return VELOCIDADES[Math.min(VELOCIDADES.length - 1, Math.max(0, desde + paso))];
};

/**
 * El reloj de la demo. No hace nada si la dirección no trae `?demo=1`: el juego queda igual que siempre.
 * El avance se calcula con el tiempo real, así una pestaña lenta no adelanta ni atrasa el guion.
 */
export function useDemo(): Demo {
  // sin navegador (por ejemplo, al dibujar en un test) la demo queda apagada
  const [config] = useState(() => leerParametrosDeDemo(typeof window === "undefined" ? "" : window.location.search));
  const guion = useMemo(() => construirGuion(), []);
  const total = useMemo(() => duracionTotal(guion), [guion]);
  const [t, setT] = useState(0);
  const [empezo, setEmpezo] = useState(false);
  const [pausada, setPausada] = useState(false);
  const [detenida, setDetenida] = useState(false);
  const [velocidad, setVelocidad] = useState(config.velocidad);
  const [ratonQuieto, setRatonQuieto] = useState(false);

  // con `auto=0` la demo espera el botón; si no, arranca sola a los dos segundos
  useEffect(() => {
    if (!config.activo || !config.iniciarSolo) return;
    const id = setTimeout(() => setEmpezo(true), 2000);
    return () => clearTimeout(id);
  }, [config]);

  useEffect(() => {
    if (!empezo || detenida || pausada) return;
    let anterior = performance.now();
    const id = setInterval(() => {
      const ahora = performance.now();
      const salto = (ahora - anterior) * velocidad;
      anterior = ahora;
      setT((v) => Math.min(total, v + salto));
    }, 70);
    return () => clearInterval(id);
  }, [empezo, detenida, pausada, velocidad, total]);

  const empezar = useCallback(() => {
    setT(0);
    setDetenida(false);
    setPausada(false);
    setEmpezo(true);
  }, []);

  const alternarPausa = useCallback(() => setPausada((p) => !p), []);

  const reiniciar = useCallback(() => {
    setT(0);
    setDetenida(false);
    setPausada(false);
    setEmpezo(true);
  }, []);

  const detener = useCallback(() => {
    setEmpezo(false);
    setDetenida(true);
  }, []);

  const cambiarVelocidad = useCallback((v: number) => setVelocidad(Math.min(4, Math.max(0.25, v))), []);

  // teclas: espacio pausa, flechas cambian la velocidad, R vuelve al principio, Esc detiene
  useEffect(() => {
    if (!config.activo) return;
    const alTeclear = (e: KeyboardEvent) => {
      const enUnCampo = document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT";
      if (e.key === "Escape") {
        setEmpezo(false);
        setDetenida(true);
        return;
      }
      if (!empezo || detenida || enUnCampo) return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        setPausada((p) => !p);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setVelocidad((v) => velocidadMasCercana(v, 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setVelocidad((v) => velocidadMasCercana(v, -1));
      } else if (e.key.toLowerCase() === "r") {
        setT(0);
        setPausada(false);
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [config.activo, empezo, detenida]);

  // el cursor se esconde mientras corre y vuelve a aparecer en cuanto el mouse se mueve
  useEffect(() => {
    if (!config.activo) return;
    let id = 0;
    const alMover = () => {
      setRatonQuieto(true);
      clearTimeout(id);
      id = window.setTimeout(() => setRatonQuieto(false), 1600);
    };
    window.addEventListener("pointermove", alMover);
    return () => {
      window.removeEventListener("pointermove", alMover);
      clearTimeout(id);
    };
  }, [config.activo]);

  useEffect(() => {
    if (!config.activo) return;
    const anterior = document.body.style.cursor;
    const esconder = empezo && !detenida && !pausada && !ratonQuieto;
    document.body.style.cursor = esconder ? "none" : "";
    return () => {
      document.body.style.cursor = anterior;
    };
  }, [config.activo, empezo, detenida, pausada, ratonQuieto]);

  const vista = useMemo(() => vistaEn(t, guion), [t, guion]);
  // el pedido de cámara tiene que ser el mismo objeto mientras no cambie el paso: si cambia,
  // el lienzo vuelve a viajar y la imagen tiembla
  // el encuadre se afina cuando se abre o se cierra la columna de la derecha: el mapa se achica y la
  // oficina tiene que volver a quedar en el medio, no corrida hacia un costado
  const vez = (vista.enfoque?.vez ?? -1) * 4 + (vista.columna !== null ? 1 : 0);
  const indiceEnfoque = vista.enfoque?.indice ?? -1;
  const enfoque = useMemo(
    () => (vez < 0 || indiceEnfoque < 0 ? null : { indice: indiceEnfoque, vez, zona: vista.enfoque?.zona ?? zonaDeSala(indiceEnfoque) }),
    [vez, indiceEnfoque, vista.enfoque?.zona],
  );

  return {
    activo: config.activo,
    empezo,
    pausada,
    detenida,
    velocidad,
    vista,
    total,
    tiempo: t,
    enfoque,
    empezar,
    detener,
    alternarPausa,
    cambiarVelocidad,
    reiniciar,
  };
}
