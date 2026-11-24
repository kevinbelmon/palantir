import { ACTIVIDAD_DEMO, CIERRE_DEMO, DIALOGOS_DEMO, INTRO_DEMO, NARRACION_DEMO } from "../contenido/demo";
import { textosDe } from "../contenido";
import { MUNDO, SALAS } from "../oficina";
import { AGENTES } from "./agentes";
import { ESTADO_INICIAL, reducir, type Estado } from "./estado";

/** Cuánto se abre el encuadre alrededor de una oficina, como fracción de su tamaño (0.3 = un 60% más). */
const AIRE_ZONA = 0.3;

/**
 * El pedazo del plano que se encuadra al mostrar una oficina: el cuarto, su puerta y un poco de pasillo.
 * Sin esto la cámara se mete dentro del cuarto y se ve un escritorio gigante.
 */
export function zonaDeSala(indice: number): { x: number; y: number; w: number; h: number } {
  const a = SALAS[indice].area;
  const mx = a.w * AIRE_ZONA;
  const my = Math.min(a.h * AIRE_ZONA, 340);
  const w = Math.min(MUNDO.ancho, a.w + mx * 2);
  const h = Math.min(MUNDO.alto, a.h + my * 2);
  // se corre para adentro del mundo sin cambiar el tamaño: así la oficina no queda pegada a un borde
  const x = Math.min(Math.max(0, a.x - mx), MUNDO.ancho - w);
  const y = Math.min(Math.max(0, a.y - my), MUNDO.alto - h);
  return { x, y, w, h };
}

// El director de la demo: una lista de pasos con su duración y una función que, dado un instante,
// dice exactamente qué se ve. No hay azar, no hay relojes propios y no se llama a ninguna IA:
// el mismo instante da siempre la misma imagen, así el video se puede volver a grabar igual.

/** Un mensaje del chat tal como lo muestra el panel. */
export type MensajeDemo = { rol: "agente" | "persona"; texto: string };

export type Paso =
  | { tipo: "narracion"; titulo: string; texto: string; ms: number }
  | { tipo: "camara"; indice: number; ms: number }
  | { tipo: "dejarBrief"; ms: number }
  | { tipo: "abrirAgente"; indice: number; ms: number }
  | { tipo: "ordenar"; indice: number; ms: number }
  | { tipo: "agenteEscribiendo"; indice: number; ms: number }
  | { tipo: "mensajeAgente"; indice: number; texto: string; ms: number }
  | { tipo: "personaEscribiendo"; indice: number; texto: string; ms: number }
  | { tipo: "terminar"; indice: number; ms: number }
  | { tipo: "documento"; indice: number; ms: number }
  | { tipo: "cerrarDocumento"; ms: number };

/** Lo que se ve en un instante de la demo. Es una foto: no se modifica, se vuelve a calcular. */
export type VistaDemo = {
  estado: Estado;
  narracion: { titulo: string; texto: string } | null;
  /** Qué agente está elegido en el mapa, si hay alguno. */
  seleccion: number | null;
  /** El chat de cada agente, hasta el instante pedido. */
  chat: Record<number, MensajeDemo[]>;
  /** El agente está por escribir: se ve «escribiendo…». */
  escribiendo: boolean;
  /** Lo que la persona está tipeando en la caja de abajo. */
  borrador: string;
  /** Qué se está viendo en la columna de la derecha. */
  columna: "agente" | "documento" | "final" | null;
  /** Pedido de cámara: la sala a la que hay que viajar, con el pedazo de plano que hay que encuadrar. */
  enfoque: { indice: number; vez: number; zona?: { x: number; y: number; w: number; h: number } } | null;
  /** Lo que está haciendo el agente que corre ahora. */
  actividad: readonly string[];
  /** El paso del guion que se está viendo (para depurar y para los tests). */
  pasoActual: Paso | null;
};

/** Cuánto tarda el agente en «escribir» antes de que aparezca su mensaje (entre 1 y 2 segundos). */
export const msEscribiendo = (texto: string): number => Math.min(2400, Math.max(1000, 800 + texto.length * 16));

/** Cuánto tarda en aparecer el texto, letra por letra. */
export const msTipeo = (texto: string): number => 300 + texto.length * 9;

/** Cuánto tarda la persona en tipear y en mandar. */
export const msPersona = (texto: string): number => 700 + texto.length * 11 + 200;

// Ritmo de lectura tranquilo: la demo se mira, no se corre. Con los controles se puede acelerar.
const NARRACION_PASO = 3000;
const NARRACION_INTRO = 5000;
const VIAJE_CAMARA = 1500;
const ABRIR_PANEL = 850;
const DAR_ORDEN = 850;
const TERMINAR = 1100;
const LEER_DOCUMENTO = 2500;
const CERRAR = 300;

/**
 * Arma el guion completo: presenta la oficina, deja el brief y recorre los ocho agentes en orden,
 * cada uno con su chat. Al final cierra con la pantalla del recorrido terminado.
 */
export function construirGuion(): readonly Paso[] {
  const pasos: Paso[] = [];

  for (const c of INTRO_DEMO) pasos.push({ tipo: "narracion", titulo: c.titulo, texto: c.texto, ms: NARRACION_INTRO });
  pasos.push({ tipo: "narracion", titulo: "Dejar el brief", texto: "Tocamos la mesa de la papelería y el brief queda dejado. La hoja viaja sola hasta la oficina 1.", ms: NARRACION_PASO });
  pasos.push({ tipo: "dejarBrief", ms: 1400 });
  pasos.push({ tipo: "camara", indice: 0, ms: VIAJE_CAMARA });

  AGENTES.forEach((agente, i) => {
    const t = textosDe(agente.id);
    pasos.push({ tipo: "narracion", titulo: `Paso ${agente.numero}: ${t.nombre}`, texto: NARRACION_DEMO[agente.id], ms: NARRACION_PASO });
    pasos.push({ tipo: "camara", indice: i, ms: VIAJE_CAMARA });
    pasos.push({ tipo: "abrirAgente", indice: i, ms: ABRIR_PANEL });
    pasos.push({ tipo: "ordenar", indice: i, ms: DAR_ORDEN });
    for (const intercambio of DIALOGOS_DEMO[agente.id]) {
      pasos.push({ tipo: "agenteEscribiendo", indice: i, ms: msEscribiendo(intercambio.agente) });
      pasos.push({ tipo: "mensajeAgente", indice: i, texto: intercambio.agente, ms: msTipeo(intercambio.agente) });
      pasos.push({ tipo: "personaEscribiendo", indice: i, texto: intercambio.persona, ms: msPersona(intercambio.persona) });
    }
    pasos.push({ tipo: "terminar", indice: i, ms: TERMINAR });
    pasos.push({ tipo: "documento", indice: i, ms: LEER_DOCUMENTO });
    pasos.push({ tipo: "cerrarDocumento", ms: CERRAR });
  });

  for (const c of CIERRE_DEMO) pasos.push({ tipo: "narracion", titulo: c.titulo, texto: c.texto, ms: NARRACION_INTRO });
  return pasos;
}

/** Cuánto dura la demo completa, en milisegundos (a velocidad 1). */
export function duracionTotal(pasos: readonly Paso[] = construirGuion()): number {
  return pasos.reduce((suma, p) => suma + p.ms, 0);
}

/**
 * La foto de la demo en el instante `t`. Se recalcula desde cero cada vez, así no queda ningún estado
 * escondido: el mismo `t` siempre da la misma vista.
 */
export function vistaEn(t: number, pasos: readonly Paso[] = construirGuion()): VistaDemo {
  let estado = ESTADO_INICIAL;
  let narracion: VistaDemo["narracion"] = null;
  let seleccion: number | null = null;
  let escribiendo = false;
  let borrador = "";
  let enfoque: VistaDemo["enfoque"] = null;
  let pasoActual: Paso | null = null;
  const chat: Record<number, MensajeDemo[]> = {};
  let actividad: readonly string[] = [];

  const agregar = (indice: number, m: MensajeDemo) => {
    (chat[indice] ??= []).push(m);
  };

  let inicio = 0;
  for (const paso of pasos) {
    if (t < inicio) break;
    const fin = inicio + paso.ms;
    const completo = t >= fin;
    const k = completo ? 1 : (t - inicio) / paso.ms;
    pasoActual = paso;
    escribiendo = false;

    switch (paso.tipo) {
      case "narracion":
        narracion = { titulo: paso.titulo, texto: paso.texto };
        break;
      case "camara":
        enfoque = { indice: paso.indice, vez: inicio, zona: zonaDeSala(paso.indice) };
        break;
      case "dejarBrief":
        if (completo) estado = reducir(estado, { tipo: "dejarBrief" });
        break;
      case "abrirAgente":
        // la explicación sigue a la vista mientras el agente trabaja: así se lee junto a lo que hace
        seleccion = paso.indice;
        break;
      case "ordenar":
        if (completo || k > 0.4) {
          estado = reducir(estado, { tipo: "ordenarCorrer", indice: paso.indice });
          actividad = ACTIVIDAD_DEMO[AGENTES[paso.indice].id];
        }
        break;
      case "agenteEscribiendo":
        escribiendo = !completo;
        break;
      case "mensajeAgente":
        agregar(paso.indice, { rol: "agente", texto: paso.texto.slice(0, Math.max(1, Math.ceil(paso.texto.length * k))) });
        break;
      case "personaEscribiendo": {
        const visible = paso.texto.slice(0, Math.max(0, Math.ceil(paso.texto.length * k)));
        borrador = completo ? "" : visible;
        if (completo) agregar(paso.indice, { rol: "persona", texto: paso.texto });
        break;
      }
      case "terminar":
        if (completo) {
          estado = reducir(estado, { tipo: "terminarCorrida", indice: paso.indice });
          actividad = [];
        }
        break;
      case "documento":
        if (completo || k > 0.5) estado = reducir(estado, { tipo: "abrirDocumento", indice: paso.indice });
        break;
      case "cerrarDocumento":
        if (completo) {
          estado = reducir(estado, { tipo: "cerrarDocumento" });
          // se cierra el panel del agente: la explicación del paso siguiente se ve sobre el mapa entero
          seleccion = null;
          actividad = [];
        }
        break;
    }

    if (!completo) break;
    inicio = fin;
  }

  const columna: VistaDemo["columna"] = estado.fin ? "final" : estado.documentoAbierto !== null ? "documento" : seleccion !== null ? "agente" : null;

  return { estado, narracion, seleccion, chat, escribiendo, borrador, columna, enfoque, actividad, pasoActual };
}
