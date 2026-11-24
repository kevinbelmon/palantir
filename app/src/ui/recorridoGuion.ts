import { DOCUMENTOS, textosDe } from "../contenido";
import { AGENTES, ESTADO_INICIAL, reducir, type AgenteId, type Estado } from "../flujo";
import { MUNDO, PAPELERIA, SALAS, type Rect } from "../oficina";
import { MESA_REDONDA_REVIEW } from "../oficina/decoracion";

// El recorrido explicado: un video dentro de la aplicación. No corre ningún comando: Zac lleva a la persona
// por cada lugar de la casa, la cámara se acerca, un marco amarillo señala de qué habla y el texto aparece despacio.

export type PasoRecorrido = {
  /** A qué capítulo pertenece (para la barra de arriba). */
  capitulo: number;
  titulo: string;
  texto: string;
  /** Qué pedazo del plano encuadra la cámara. */
  zona: Rect;
  /** Lo que se señala con el marco amarillo, o `null` si no se señala nada. */
  marca: Rect | null;
  /** Cómo se ve la oficina en este momento: quién trabaja, quién terminó y dónde está el brief. */
  estado: Estado;
  /** Cuánto dura el paso, en milisegundos. Si no se indica, depende del largo del texto. */
  duracion?: number;
};

const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/** Cuánto se puede salir de la casa hacia el pasto al encuadrar (hace falta arriba de las oficinas de la fila de arriba). */
export const MARGEN_FUERA_DE_LA_CASA = 160;

/** Un pedazo del plano con aire alrededor (`ay` abajo y `arriba` más lugar arriba), sin irse más lejos del borde de la casa que el pasto. */
function conAire(r: Rect, ax: number, ay: number, arriba = ay): Rect {
  const x = Math.max(-MARGEN_FUERA_DE_LA_CASA, r.x - ax);
  const y = Math.max(-MARGEN_FUERA_DE_LA_CASA, r.y - arriba);
  return rect(x, y, Math.min(MUNDO.ancho + MARGEN_FUERA_DE_LA_CASA, r.x + r.w + ax) - x, Math.min(MUNDO.alto + MARGEN_FUERA_DE_LA_CASA, r.y + r.h + ay) - y);
}

/** Lo que sube el cartel con el nombre de la oficina por encima de su borde de arriba: hay que dejarle lugar para que se lea. */
const LUGAR_PARA_EL_CARTEL = 150;

const TODO = rect(0, 0, MUNDO.ancho, MUNDO.alto);

const hacia = (r: Rect, adentro: number): Rect => rect(r.x + adentro, r.y + adentro, r.w - adentro * 2, r.h - adentro * 2);

/** El lugar donde trabaja el agente: su escritorio con su silla (o la mesa de reuniones, en la sala de vidrio). */
function puestoDe(indice: number): Rect {
  const s = SALAS[indice];
  if (s.tipo === "vidrio") {
    const m = MESA_REDONDA_REVIEW;
    return rect(m.x - m.rx - 30, m.y - m.ry - 30, m.rx * 2 + 60, m.ry * 2 + 60);
  }
  const e = s.escritorio;
  const arriba = s.personaje.y - 60;
  return rect(e.x - 12, arriba, e.w + 24, e.y + e.h + 12 - arriba);
}

/** La oficina entera, bien cerca (en la de vidrio, que es muy alta, se encuadra la mesa con algo de aire). */
function zonaDeOficina(indice: number): Rect {
  const s = SALAS[indice];
  // la sala de vidrio es muy alta: se encuadra desde su cartel hasta el borde de abajo de la mesa
  if (s.tipo === "vidrio") {
    const mesa = puestoDe(indice);
    return conAire(rect(s.area.x, s.area.y, s.area.w, mesa.y + mesa.h - s.area.y), 40, 20, LUGAR_PARA_EL_CARTEL);
  }
  return conAire(s.area, 10, 10, LUGAR_PARA_EL_CARTEL);
}

/** Lo que sube el globito con lo que dice el agente por encima de su cabeza: hay que dejarle lugar para que no se corte. */
const LUGAR_PARA_EL_GLOBITO = 140;

/** El agente y su escritorio, todavía más cerca (con lugar arriba para su globito). */
function zonaDeAgente(indice: number): Rect {
  const lado = SALAS[indice].tipo === "vidrio" ? 40 : 60;
  return conAire(puestoDe(indice), lado, 40, LUGAR_PARA_EL_GLOBITO);
}

/** Las dos oficinas juntas, con aire: lo que se encuadra mientras el brief pasa de una a la otra. */
function zonaDelTraslado(desde: number, hasta: number): Rect {
  const a = SALAS[desde].area;
  const b = SALAS[hasta].area;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return conAire(rect(x, y, Math.max(a.x + a.w, b.x + b.w) - x, Math.max(a.y + a.h, b.y + b.h) - y), 40, 40, LUGAR_PARA_EL_CARTEL);
}

/** Cuánto dura el paso de traslado entre oficinas: lo justo para ver viajar al brief. */
export const DURACION_DEL_TRASLADO_MS = 6000;

/** La partida a medias: el brief ya está dejado y los agentes de antes terminaron. */
function estadoCon(terminados: number, corriendo: number | null, conDocumentoDe?: number): Estado {
  let e = reducir(ESTADO_INICIAL, { tipo: "dejarBrief" });
  for (let i = 0; i < terminados; i++) {
    e = reducir(e, { tipo: "ordenarCorrer", indice: i });
    e = reducir(e, { tipo: "terminarCorrida", indice: i });
  }
  if (corriendo !== null) e = reducir(e, { tipo: "ordenarCorrer", indice: corriendo });
  if (conDocumentoDe !== undefined) {
    e = reducir(e, { tipo: "ordenarCorrer", indice: conDocumentoDe });
    e = reducir(e, { tipo: "terminarCorrida", indice: conDocumentoDe });
  }
  return e;
}

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** «a, b y c» */
const lista = (partes: readonly string[]): string => (partes.length <= 1 ? (partes[0] ?? "") : `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`);

/** Qué aporta cada agente al modelo, dicho de forma directa: su función dentro del flujo y cómo trabaja. */
const PROFESIONAL: Record<AgenteId, { funcion: string; trabajo: string }> = {
  refine: {
    funcion: "«Refine» significa «pulir». Es el primer paso del modelo: toma el brief inicial y lo convierte en un pedido claro, sin ambigüedades.",
    trabajo: "Revisa el brief, identifica lo que falta o admite más de una interpretación y formula las preguntas necesarias. Así se evita construir algo distinto de lo que se pidió.",
  },
  generate: {
    funcion: "«Generate» significa «generar». A partir del pedido ya pulido, produce la documentación base del proyecto.",
    trabajo: "Redacta cuatro documentos: las reglas del proyecto, las historias de usuario, el plan y la lista de tareas. Todo el equipo trabaja sobre la misma referencia antes de construir.",
  },
  validate: {
    funcion: "«Validate» significa «validar». Verifica que la documentación generada cubra todo lo que se pidió.",
    trabajo: "Compara el brief con cada documento y reporta lo que quedó sin cubrir o a medias. Los huecos se corrigen en esta etapa, cuando todavía es barato hacerlo.",
  },
  log: {
    funcion: "«Log» significa «registro». Deja constancia de cada decisión que modifica o amplía lo acordado.",
    trabajo: "Registra qué cambió, qué alternativas se evaluaron, por qué se eligió una y quién decidió. Así cualquier decisión se entiende meses después, sin depender de la memoria de nadie.",
  },
  implement: {
    funcion: "«Implement» significa «implementar». Es la etapa de construcción: convierte el plan en una aplicación que funciona.",
    trabajo: "Avanza tarea por tarea. Escribe primero las pruebas, después el programa, y repite hasta que todo pasa. Si algo falla, queda a la vista antes de seguir.",
  },
  e2e: {
    funcion: "«E2E» significa «de punta a punta». Verifica el funcionamiento real de la aplicación, recorriéndola como lo haría un usuario.",
    trabajo: "Ejecuta los recorridos principales sobre la aplicación en marcha y guarda la evidencia de cada paso. Comprueba que todas las partes funcionan juntas.",
  },
  checklist: {
    funcion: "«Checklist» significa «lista de verificación». Reúne los criterios que solo una persona puede juzgar.",
    trabajo: "Elabora una lista de puntos para revisar a mano: si el texto se entiende, si el diseño es claro, si el uso es cómodo. La completa una persona, no un programa.",
  },
  review: {
    funcion: "«Review» significa «revisión». Es el cierre del modelo: contrasta todo lo pedido con todo lo entregado.",
    trabajo: "Repasa el pedido, el plan, las pruebas, el recorrido de punta a punta y la lista manual. Con toda la evidencia a la vista, decide si el trabajo está terminado.",
  },
};

export const CAPITULOS: readonly string[] = ["Bienvenida", "La papelería", ...AGENTES.map((a) => textosDe(a.id).nombre), "Final"];

/** Todos los pasos del recorrido, en orden. */
export function construirRecorrido(): PasoRecorrido[] {
  const pasos: PasoRecorrido[] = [];
  const agregar = (p: PasoRecorrido) => pasos.push(p);
  const conBrief = estadoCon(0, null);

  // 0 · bienvenida
  agregar({
    capitulo: 0,
    titulo: "Soy Zac, tu asistente",
    texto: "Soy Zac, el asistente de este recorrido. Vamos a visitar la oficina donde trabajan los ocho agentes principales del modelo y a ver qué aporta cada uno. No hace falta conocimiento técnico previo.",
    zona: TODO,
    marca: null,
    estado: ESTADO_INICIAL,
  });
  agregar({
    capitulo: 0,
    titulo: "Cómo funciona el modelo",
    texto: "El SDD organiza el trabajo en etapas. Primero se documenta todo lo que se quiere construir, después esa documentación se revisa y se pule, y recién entonces se construye.",
    zona: TODO,
    marca: null,
    estado: ESTADO_INICIAL,
  });
  agregar({
    capitulo: 0,
    titulo: "Los ocho agentes",
    texto: "Cada agente se encarga de una etapa. Trabajan en secuencia: cada uno recibe el resultado del anterior, lo completa y se lo entrega al siguiente.",
    zona: TODO,
    marca: null,
    estado: ESTADO_INICIAL,
  });

  // 1 · la papelería
  const papeleria = hacia(PAPELERIA, 18);
  const zonaPapeleria = conAire(PAPELERIA, 90, 80, 130);
  agregar({
    capitulo: 1,
    titulo: "La papelería: el material inicial",
    texto: "La papelería reúne los documentos iniciales del proyecto. Es el punto de partida: ahí se deja el brief, que describe la idea y el alcance en pocas líneas.",
    zona: zonaPapeleria,
    marca: papeleria,
    estado: ESTADO_INICIAL,
  });
  agregar({
    capitulo: 1,
    titulo: "El brief inicial",
    texto: "El brief es el documento de arranque: la idea del proyecto escrita en pocas líneas. Por ejemplo, una aplicación para dividir los gastos de un viaje entre amigos. Al dejarlo, se habilita el primer agente.",
    zona: zonaPapeleria,
    marca: papeleria,
    estado: conBrief,
  });

  // 1 (sigue) · de la papelería a las oficinas
  agregar({
    capitulo: 1,
    titulo: "El camino del brief",
    texto: "El brief avanza de oficina en oficina, siempre en el mismo orden, y cada agente suma su trabajo. Ahora visitamos las ocho: en cada una vemos su función, cómo trabaja y qué entrega.",
    zona: TODO,
    marca: null,
    estado: conBrief,
  });

  // 3..10 · cada agente, tres momentos: qué es, qué hace y qué deja
  AGENTES.forEach((a, i) => {
    const t = textosDe(a.id);
    const doc = DOCUMENTOS[a.id];
    const partes = lista(doc.bloques.map((b) => minuscula(b.encabezado)));
    const cierre = i < AGENTES.length - 1 ? "" : " Con esto, el trabajo queda terminado y revisado.";
    const marca = puestoDe(i);
    agregar({
      capitulo: 2 + i,
      titulo: `Oficina ${a.numero} · ${t.nombre}`,
      texto: PROFESIONAL[a.id].funcion,
      zona: zonaDeOficina(i),
      marca,
      estado: estadoCon(i, null),
    });
    agregar({
      capitulo: 2 + i,
      titulo: `Cómo trabaja ${t.nombre}`,
      texto: PROFESIONAL[a.id].trabajo,
      zona: zonaDeAgente(i),
      marca,
      estado: estadoCon(i, i),
    });
    agregar({
      capitulo: 2 + i,
      titulo: `Entregable de ${t.nombre}`,
      texto: `El resultado de este paso es el documento «${doc.titulo}». Tiene estas secciones: ${partes}.${cierre}`,
      zona: zonaDeAgente(i),
      marca,
      estado: estadoCon(i, null, i),
    });
    // el brief viaja a la oficina siguiente: la cámara abre el plano para mostrar las dos y se ve el papel recorrer el camino
    if (i < AGENTES.length - 1) {
      const sigue = textosDe(AGENTES[i + 1].id).nombre;
      agregar({
        capitulo: 2 + i,
        titulo: `Hacia la oficina ${a.numero + 1}`,
        texto: `El brief pasa a la oficina ${a.numero + 1}: ${sigue}. Su trabajo empieza donde terminó el de ${t.nombre}.`,
        zona: zonaDelTraslado(i, i + 1),
        marca: null,
        estado: estadoCon(i + 1, null),
        duracion: DURACION_DEL_TRASLADO_MS,
      });
    }
  });

  // 11 · final
  const todos = estadoCon(AGENTES.length, null);
  agregar({
    capitulo: 2 + AGENTES.length,
    titulo: "Cierre del recorrido",
    texto: "Así queda completo el recorrido: de una idea escrita en un papel a un trabajo construido, probado y revisado, con cada decisión registrada.",
    zona: TODO,
    marca: null,
    estado: todos,
  });
  agregar({
    capitulo: 2 + AGENTES.length,
    titulo: "Ahora podés empezar",
    texto: "Dejá tu propio brief en la papelería y seguí el trabajo de los agentes. Si necesitás repasar algo, Zac está en la esquina para explicártelo de nuevo.",
    zona: zonaPapeleria,
    marca: papeleria,
    estado: ESTADO_INICIAL,
  });

  return pasos;
}

/** Una página de la presentación del principio: un título y un texto, o una lista de ideas. */
export type PaginaPresentacion = { titulo: string; texto?: string; puntos?: readonly { titulo: string; texto: string }[] };

/** Cuántos comandos tiene el modelo en total (los 8 principales son los del juego). */
export const COMANDOS_DEL_MODELO = 25;

/** La presentación que se ve al abrir el juego, antes del recorrido. */
export const PRESENTACION: readonly PaginaPresentacion[] = [
  {
    titulo: "Bienvenidos al SDD",
    texto: "SDD son las siglas de Spec-Driven Development, que en español es «desarrollo guiado por documentos». Es una forma de construir programas sin improvisar: primero se documenta todo lo que se quiere hacer y recién después se construye.",
  },
  {
    titulo: "El modelo, en tres ideas",
    puntos: [
      { titulo: "1. Primero documentamos todo", texto: "Antes de construir, se deja por escrito qué se quiere hacer y cómo." },
      { titulo: "2. Lo vamos puliendo", texto: "Se revisan los documentos una y otra vez hasta que no queda ninguna duda." },
      { titulo: "3. Recién ahí construimos", texto: "Con los documentos claros, se construye, se prueba y se hace una revisión final." },
    ],
  },
  {
    titulo: `${COMANDOS_DEL_MODELO} comandos, 8 imprescindibles`,
    texto: `El modelo tiene ${COMANDOS_DEL_MODELO} comandos y cada uno cubre una tarea del trabajo. Estos son los ocho principales, en el orden en que se ejecutan:`,
    puntos: AGENTES.map((a) => ({ titulo: `${a.numero}. ${textosDe(a.id).nombre}`, texto: textosDe(a.id).resumen })),
  },
];

/** Cuántas letras por segundo escribe Zac. */
export const LETRAS_POR_SEGUNDO = 45;

const palabras = (texto: string) => texto.trim().split(/\s+/).filter(Boolean).length;

/** Cuánto tarda en escribirse el texto del paso, en milisegundos. */
export function duracionDeTipeo(paso: PasoRecorrido): number {
  return Math.round((paso.texto.length / LETRAS_POR_SEGUNDO) * 1000);
}

/** Cuánto dura el paso: lo que tarda en escribirse más un rato para leerlo tranquilo. */
export function duracionDePaso(paso: PasoRecorrido): number {
  if (paso.duracion !== undefined) return paso.duracion;
  return duracionDeTipeo(paso) + 1800 + palabras(paso.texto) * 230;
}

/** Lo que se ve escrito del texto a los `ms` de empezar el paso. */
export function textoVisible(paso: PasoRecorrido, ms: number): string {
  const n = Math.min(paso.texto.length, Math.floor((Math.max(0, ms) / 1000) * LETRAS_POR_SEGUNDO));
  return paso.texto.slice(0, n);
}

/** El primer paso de cada capítulo (para saltar con la barra de arriba). */
export function primerPasoDe(capitulo: number, pasos: readonly PasoRecorrido[]): number {
  const i = pasos.findIndex((p) => p.capitulo === capitulo);
  return i === -1 ? 0 : i;
}
