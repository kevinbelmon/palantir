import { useCallback, useMemo, useState } from "react";
import type { Enfoque } from "./Lienzo";
import { construirRecorrido, primerPasoDe, type PasoRecorrido } from "./recorridoGuion";

/** Cuánto tarda la cámara en ir de un lugar al siguiente: lento y parejo, para que se entienda adónde va. */
export const DURACION_DEL_VIAJE_MS = 1700;

/** Las dos velocidades del recorrido: la normal (lenta, para leer tranquilo) y una más rápida. */
export const VELOCIDADES_RECORRIDO = [1, 1.5] as const;

/** Dónde está la persona: viendo la presentación de bienvenida, en el recorrido explicado, o jugando. */
export type Fase = "presentacion" | "recorrido" | "juego";

/**
 * Cómo arranca el juego según la dirección:
 * - sin nada: la presentación de bienvenida;
 * - `?recorrido=1`: directo al recorrido (sirve para grabarlo);
 * - `?presentacion=0`: directo al juego.
 * Sin navegador (al dibujar en un test) arranca jugando.
 */
export function faseInicial(busqueda: string | null): Fase {
  if (busqueda === null) return "juego";
  const p = new URLSearchParams(busqueda);
  if (p.get("recorrido") === "1") return "recorrido";
  if (p.get("presentacion") === "0") return "juego";
  return "presentacion";
}

export type Recorrido = {
  fase: Fase;
  /** Se ve la presentación de bienvenida. */
  presentacion: boolean;
  /** Corre el recorrido explicado. */
  activo: boolean;
  pausado: boolean;
  velocidad: number;
  pasos: readonly PasoRecorrido[];
  paso: number;
  actual: PasoRecorrido;
  /** Cambia cada vez que arranca un paso (o se lo repite): sirve para reiniciar lo que depende del tiempo del paso. */
  clave: string;
  /** Hacia dónde mira la cámara. Es el mismo objeto mientras no cambie el paso. */
  enfoque: Enfoque;
  /** Empieza el recorrido desde el principio. */
  empezar: () => void;
  /** Cierra la presentación o el recorrido y deja jugar. */
  irAlJuego: () => void;
  siguiente: () => void;
  anterior: () => void;
  reiniciarPaso: () => void;
  irACapitulo: (capitulo: number) => void;
  alternarPausa: () => void;
  alternarVelocidad: () => void;
};

/**
 * Lo que decide el recorrido: en qué fase está y en qué paso. El reloj que va corriendo dentro de cada paso NO vive acá:
 * lo lleva la burbuja de Zac, así el juego entero no se vuelve a dibujar varias veces por segundo.
 */
export function useRecorrido(): Recorrido {
  const pasos = useMemo(() => construirRecorrido(), []);
  const [fase, setFase] = useState<Fase>(() => faseInicial(typeof window === "undefined" ? null : window.location.search));
  const [paso, setPaso] = useState(0);
  const [repeticion, setRepeticion] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [velocidad, setVelocidad] = useState<number>(VELOCIDADES_RECORRIDO[0]);

  const ir = useCallback(
    (n: number) => {
      setPaso(Math.min(pasos.length - 1, Math.max(0, n)));
      setRepeticion(0);
    },
    [pasos],
  );

  const empezar = useCallback(() => {
    setPaso(0);
    setRepeticion(0);
    setPausado(false);
    setFase("recorrido");
  }, []);
  const irAlJuego = useCallback(() => setFase("juego"), []);
  const siguiente = useCallback(() => ir(paso + 1), [ir, paso]);
  const anterior = useCallback(() => ir(paso - 1), [ir, paso]);
  const reiniciarPaso = useCallback(() => setRepeticion((r) => r + 1), []);
  const irACapitulo = useCallback((c: number) => ir(primerPasoDe(c, pasos)), [ir, pasos]);
  const alternarPausa = useCallback(() => setPausado((p) => !p), []);
  const alternarVelocidad = useCallback(() => setVelocidad((v) => (v === VELOCIDADES_RECORRIDO[0] ? VELOCIDADES_RECORRIDO[1] : VELOCIDADES_RECORRIDO[0])), []);

  const actual = pasos[paso];
  const enfoque = useMemo<Enfoque>(() => ({ indice: 0, vez: paso + 1, zona: pasos[paso].zona, duracion: DURACION_DEL_VIAJE_MS }), [paso, pasos]);

  return {
    fase,
    presentacion: fase === "presentacion",
    activo: fase === "recorrido",
    pausado,
    velocidad,
    pasos,
    paso,
    actual,
    clave: `${paso}-${repeticion}-${velocidad}`,
    enfoque,
    empezar,
    irAlJuego,
    siguiente,
    anterior,
    reiniciarPaso,
    irACapitulo,
    alternarPausa,
    alternarVelocidad,
  };
}
