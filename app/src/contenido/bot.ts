import { AGENTES, type AgenteId, type Estado } from "../flujo";
import { TEXTOS_AGENTES } from "./agentes";

/** El bot que acompaña a la persona desde una esquina y le explica cada paso. */
export const NOMBRE_BOT = "Zac";

export type TarjetaBot = { titulo: string; texto: string };

/** De qué está hablando el bot ahora. */
export type ContextoBot = { tipo: "intro" } | { tipo: "agente"; indice: number } | { tipo: "fin" };

type ExplicacionAgente = {
  /** El lugar que ocupa el paso dentro del modelo. */
  rol: string;
  /** Qué hace el agente, en pasos cortos. */
  hace: string;
  /** Qué tiene que hacer la persona (y qué botón toca). */
  tuTarea: string;
  /** Cómo se sabe que terminó. */
  terminado: string;
  /** Qué hacer si no sabe qué responder o algo no sale. */
  siTeTrabas: string;
};

const EXPLICACIONES: Record<AgenteId, ExplicacionAgente> = {
  refine: {
    rol: "Es el primer paso del modelo: nada se construye hasta que el pedido está claro.",
    hace: "Lee el brief que dejaste en la papelería. Marca lo que no se entiende o lo que falta. Después te hace una pregunta por vez, con ejemplos, hasta que no queda ninguna duda.",
    tuTarea:
      "Tocá al agente de la oficina 1 y apretá «Ordenar que corra /sdd-refine». Cuando te pregunte algo, contestá con tus palabras en la caja de abajo. No hace falta saber de programación.",
    terminado:
      "Termina cuando todo quedó claro. Deja el pedido pulido sobre su escritorio. Apretá «Este paso está listo» para pasar al siguiente agente.",
    siTeTrabas:
      "Si no sabés una respuesta, escribí «No lo sé todavía». Es una respuesta válida y el agente la anota como pendiente. No inventes un dato para salir del paso.",
  },
  generate: {
    rol: "Es el segundo paso: transforma el pedido en documentación que todo el equipo comparte como referencia.",
    hace: "Toma el pedido ya pulido y lo convierte en cuatro documentos cortos. Son las reglas del proyecto, las historias de usuario, el plan y la lista de tareas. Una historia de usuario cuenta algo que alguien va a poder hacer, como «agregar un producto a la lista».",
    tuTarea:
      "Tocá al agente de la oficina 2 y ordenale correr. Puede pedirte que confirmes un nombre o un dato corto. Contestá y esperá a que termine.",
    terminado:
      "Termina cuando deja los cuatro documentos sobre su escritorio. Podés leerlos tocándolos. Después apretá «Este paso está listo».",
    siTeTrabas:
      "Si un documento te parece largo o raro, no pasa nada: es un borrador. Lo importante es que el plan coincida con lo que pediste. El siguiente agente lo revisa.",
  },
  validate: {
    rol: "Es el control de calidad de la documentación: se corrige antes de construir, cuando es más barato.",
    hace: "Compara el pedido original con los documentos del plan. Anota lo que quedó sin cubrir y lo que quedó a medias.",
    tuTarea:
      "Tocá al agente de la oficina 3 y ordenale correr. Si encuentra huecos, te los muestra. Vos decidís cómo arreglarlos: el agente no cambia nada por su cuenta.",
    terminado:
      "Termina con un reporte de tres partes: lo cubierto, lo que quedó a medias y lo que falta. Si todo está cubierto, te avisa que podés seguir.",
    siTeTrabas:
      "Si aparecen huecos, no es un fracaso: para eso existe este paso. Elegí cómo resolver cada uno y pasá al siguiente agente, que deja anotada tu decisión.",
  },
  log: {
    rol: "Funciona como el registro oficial del proyecto: cada decisión queda anotada con su motivo y su responsable.",
    hace: "Te hace seis preguntas, una por vez: qué cambió, qué otras opciones había, por qué se descartaron, por qué se eligió esta, qué documentos cambiaron y quién decidió. Con tus respuestas arma el registro.",
    tuTarea:
      "Tocá al agente de la oficina 4 y ordenale correr. Contestá cada pregunta con sinceridad y en pocas palabras. Al final poné tu nombre o tu rol como la persona que decidió.",
    terminado: "Termina cuando la decisión queda escrita en el registro de decisiones. Lo vas a ver sobre su escritorio.",
    siTeTrabas:
      "Si no evaluaste otras opciones, respondé «ninguna evaluada»: es una respuesta válida. Si no hubo ninguna decisión que anotar, decíselo al agente.",
  },
  implement: {
    rol: "Es la etapa de construcción: se avanza tarea por tarea y cada una se prueba antes de pasar a la siguiente.",
    hace: "Sigue la lista de tareas una por una. Escribe la prueba, escribe el programa y repite hasta que todo funciona. Va tildando cada tarea que termina.",
    tuTarea:
      "Tocá al agente de la oficina 5 y ordenale correr. Este es el paso más largo, así que esperá. Mirá su globito para saber qué está haciendo y contestale solo si te pregunta algo.",
    terminado:
      "Termina cuando todas las tareas están tildadas y todas las pruebas pasan. Si alguna prueba falla, el agente no lo da por terminado y te cuenta qué pasó.",
    siTeTrabas:
      "Si tarda mucho, es normal. Si dice que algo falló, pedile que te lo explique con palabras simples. No des el paso por listo mientras haya pruebas que fallan.",
  },
  e2e: {
    rol: "Complementa las pruebas anteriores: verifica la aplicación completa, funcionando, como la usaría una persona.",
    hace: "Abre la aplicación que se construyó y hace los recorridos principales, por ejemplo entrar, cargar algo y guardarlo. Saca una captura de pantalla en cada paso, como prueba.",
    tuTarea:
      "Tocá al agente de la oficina 6 y ordenale correr. Puede pedirte que dejes la aplicación abierta o que le cuentes cómo se entra. Contestale con lo que sepas.",
    terminado:
      "Termina con un informe y las capturas guardadas. Si un recorrido falla, queda anotado junto con la captura del momento exacto en que falló.",
    siTeTrabas:
      "Si todavía no hay ninguna aplicación para abrir, volvé al paso 5. Este paso necesita algo ya construido y funcionando.",
  },
  checklist: {
    rol: "Cubre lo que ninguna prueba automática puede medir: claridad, diseño y comodidad de uso.",
    hace: "Arma una lista corta de cosas para mirar a mano, como «¿se entiende este botón?» o «¿se lee bien este texto?».",
    tuTarea:
      "Este paso es tuyo. Abrí la aplicación, mirá cada punto de la lista y tildá lo que está bien. Anotá lo que no te convence.",
    terminado: "Termina cuando completaste la lista. Lo que no te convenció queda anotado para arreglarlo.",
    siTeTrabas:
      "Si dudás de un punto, no lo tildes. Es mejor dejar una duda anotada que decir que está bien sin estar seguro.",
  },
  review: {
    rol: "Es la verificación final: confirma que lo entregado coincide con lo pedido, con toda la evidencia a la vista.",
    hace: "Repasa el pedido, el plan, las pruebas, el recorrido y tu lista. Después revisa que lo que se ve coincida con lo prometido.",
    tuTarea: "Tocá al agente de la oficina 8 y ordenale correr. Leé el veredicto final. Si todo está bien, el trabajo queda cerrado.",
    terminado:
      "Termina con una verificación final sobre su escritorio. Si falta algo, te dice exactamente qué es y en qué paso hay que volver.",
    siTeTrabas:
      "Si dice que falta algo, volvé al paso que corresponde, arreglalo y corré review otra vez. Es parte normal del trabajo.",
  },
};

const INTRO: readonly TarjetaBot[] = [
  { titulo: `Soy ${NOMBRE_BOT}, tu asistente`, texto: "Me quedo en esta esquina para explicarte cada paso del modelo. No hace falta conocimiento técnico previo." },
  { titulo: "¿Qué es este lugar?", texto: "Es una oficina con ocho agentes. Cada uno hace un trabajo, uno después del otro, para convertir una idea en una aplicación hecha y probada." },
  { titulo: "¿Qué es un brief?", texto: "Es el documento inicial del proyecto: la idea escrita en pocas líneas. Por ejemplo, «una aplicación para dividir los gastos de un viaje entre amigos»." },
  { titulo: "Tu primer paso", texto: "Andá a la papelería, a la izquierda del lobby, y tocá la mesa para dejar el brief. Después se habilita el primer agente." },
  { titulo: "Cómo moverte", texto: "En «Caminar por adentro» usás las teclas W, A, S, D y el mouse, y apretás E para hablar con un agente. En «Ver desde arriba» tocás con el mouse. Tocá un paso de la lista de la izquierda y te lo explico." },
];

const FIN: readonly TarjetaBot[] = [
  { titulo: "¡Terminaron los ocho pasos!", texto: "Pasaste de una idea a un trabajo completo: pedido claro, plan, decisiones anotadas, aplicación construida, recorrido probado y revisión final." },
  { titulo: "¿Y ahora?", texto: "Podés leer lo que dejó cada agente tocando su paso en la lista. Para empezar otra idea, apretá «Nuevo» abajo a la izquierda." },
];

/** Las tarjetas que muestra el bot para ese tema, una tras otra. */
export function tarjetasBot(contexto: ContextoBot): readonly TarjetaBot[] {
  if (contexto.tipo === "intro") return INTRO;
  if (contexto.tipo === "fin") return FIN;
  const agente = AGENTES[contexto.indice];
  if (!agente) return INTRO;
  const t = TEXTOS_AGENTES[agente.id];
  const e = EXPLICACIONES[agente.id];
  return [
    { titulo: `¿Qué es ${t.nombre}?`, texto: `${t.queHace} ${e.rol}` },
    { titulo: "¿Qué hace el agente?", texto: e.hace },
    { titulo: "¿Qué hacés vos?", texto: e.tuTarea },
    { titulo: "¿Cómo sé que terminó?", texto: e.terminado },
    { titulo: "Si te trabás", texto: e.siTeTrabas },
  ];
}

/**
 * De qué habla el bot. Gana lo que la persona tocó (un agente en el mapa o un paso de la lista).
 * Si no tocó nada, explica el paso en el que está.
 */
export function contextoDelBot(estado: Estado, elegido: number | null): ContextoBot {
  if (estado.fin) return { tipo: "fin" };
  if (elegido !== null) return { tipo: "agente", indice: elegido };
  if (!estado.briefDejado) return { tipo: "intro" };
  if (estado.agentes.every((a) => a === "terminado")) return { tipo: "fin" };
  const actual = estado.agentes.findIndex((a) => a === "corriendo");
  const siguiente = estado.agentes.findIndex((a) => a === "habilitado");
  const indice = actual !== -1 ? actual : siguiente;
  return indice !== -1 ? { tipo: "agente", indice } : { tipo: "intro" };
}
