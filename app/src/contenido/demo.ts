import type { AgenteId } from "../flujo";
import type { Documento } from "./documentos";

// Todo lo que se dice y se muestra en la demo. Escrito de antemano: no hay ninguna llamada a una IA,
// no hay voz y no se usa internet. Cambiar un texto de acá cambia lo que se ve en el video.

/** Un ida y vuelta del chat: primero habla el agente, después la persona. */
export type Intercambio = { agente: string; persona: string };

/** El pedido que se deja en la papelería: una aplicación para la lista de compras de la casa. */
export const BRIEF_DEMO: Documento = {
  titulo: "Brief: lista de compras de la casa",
  bloques: [
    { encabezado: "El problema", lineas: ["Se anota en un papel y se pierde.", "Dos personas compran lo mismo porque nadie ve la lista del otro."] },
    { encabezado: "Quién la usa", lineas: ["La familia: cuatro personas, dos celulares."] },
  ],
};

/** Lo que explica Zac antes de cada agente. Una sola frase, sin jerga. */
export const NARRACION_DEMO: Record<AgenteId, string> = {
  refine: "Paso 1: Refine. Lee el brief de la papelería y pregunta lo que falta, hasta que no quede ninguna duda.",
  generate: "Paso 2: Generate. Convierte el pedido en cuatro documentos cortos: reglas, historias, plan y tareas.",
  validate: "Paso 3: Validate. Compara el plan con el pedido y anota lo que quedó sin cubrir.",
  log: "Paso 4: Log. Anota qué se decidió, por qué y quién, para no olvidarlo dentro de seis meses.",
  implement: "Paso 5: Implement. Escribe primero las pruebas y después el programa, hasta que todo pasa.",
  e2e: "Paso 6: E2E. Abre la lista y hace el recorrido completo, como lo haría una persona.",
  checklist: "Paso 7: Checklist. Arma la lista de lo que solo una persona puede juzgar mirando la pantalla.",
  review: "Paso 8: Review. Compara lo pedido con lo entregado y decide si el trabajo está terminado.",
};

/** Lo que el agente va contando mientras trabaja. Se ve en el panel y en su globito del mapa. */
export const ACTIVIDAD_DEMO: Record<AgenteId, readonly string[]> = {
  refine: ["Lee el brief de la papelería.", "Anota las preguntas sin respuesta.", "Escribe el pedido claro."],
  generate: ["Escribe las reglas del proyecto.", "Arma tres historias de usuario.", "Reparte el plan en tareas."],
  validate: ["Compara cada historia con el pedido.", "Encuentra dos huecos.", "Deja el reporte sin tocar nada."],
  log: ["Anota qué se decidió.", "Anota las opciones descartadas.", "Firma quién lo decidió."],
  implement: ["Escribe la prueba de agregar un producto.", "Construye la pantalla de la lista.", "Ve las nueve pruebas pasar."],
  e2e: ["Abre la lista en el celular.", "Agrega tres productos y tacha dos.", "Guarda las capturas del recorrido."],
  checklist: ["Mira la lista como una persona.", "Arma las preguntas para mirar a mano.", "Deja la lista lista para tildar."],
  review: ["Repasa el pedido y el plan.", "Compara con lo que se entregó.", "Da el visto bueno final."],
};

/** La conversación de cada agente con la persona. Tres intercambios, frases cortas, con ejemplos concretos. */
export const DIALOGOS_DEMO: Record<AgenteId, readonly Intercambio[]> = {
  refine: [
    { agente: "«Refine» significa «pulir». Ya leí el brief: una lista de compras para la casa.", persona: "Sí, para mi familia." },
    { agente: "¿Quién la va a usar y desde dónde?", persona: "Somos cuatro, y la usamos en el celular." },
    { agente: "¿La lista se comparte entre varios?", persona: "Sí, mi pareja agrega cosas desde su celular." },
  ],
  generate: [
    { agente: "«Generate» significa «generar». Convierto el pedido en cuatro documentos cortos.", persona: "¿Cuáles son?" },
    { agente: "Las reglas, las historias de usuario, el plan y la lista de tareas.", persona: "¿Qué es una historia de usuario?" },
    { agente: "Algo que una persona quiere hacer, como «agregar un producto a la lista».", persona: "Ah, eso lo entiendo." },
  ],
  validate: [
    { agente: "«Validate» significa «validar». Comparo el plan con lo que pediste.", persona: "¿Y si falta algo?" },
    { agente: "Te aviso y espero. No cambio nada sin tu permiso.", persona: "¿Qué falta ahora?" },
    { agente: "Que la lista avise cuando un producto ya está anotado.", persona: "Agregalo, nos pasa siempre." },
  ],
  log: [
    { agente: "«Log» significa «registro». Anoto cada decisión para no olvidarla.", persona: "¿Hace falta anotar todo?" },
    { agente: "Solo lo que cambió el plan, con su motivo.", persona: "Por ejemplo, lo del aviso." },
    { agente: "Eso anoté: el aviso, por qué lo agregamos y quién lo decidió.", persona: "Perfecto, así queda claro." },
  ],
  implement: [
    { agente: "«Implement» significa «construir». Escribo primero la prueba y después el programa.", persona: "¿Por qué la prueba primero?" },
    { agente: "Porque la prueba sabe cuándo terminaste. Si falla, sigo trabajando.", persona: "¿Y cuántas pruebas son?" },
    { agente: "Nueve. Agregar, tachar, avisar y guardar la lista al cerrar.", persona: "Dale, espero." },
  ],
  e2e: [
    { agente: "«E2E» significa «de punta a punta». Abro la lista y hago el recorrido completo.", persona: "¿Como si fuera yo?" },
    { agente: "Igual: agrego tres productos, tacho dos y reviso que quede guardado.", persona: "¿Y si algo no funciona?" },
    { agente: "Saco una captura del momento exacto y lo anoto en el informe.", persona: "Bien, así lo puedo ver." },
  ],
  checklist: [
    { agente: "«Checklist» significa «lista para mirar». Armo lo que solo una persona puede juzgar.", persona: "¿Qué cosas?" },
    { agente: "Si el botón se entiende, si el texto se lee, si se puede usar con una mano.", persona: "Yo la uso en el supermercado." },
    { agente: "Por eso te la dejo a vos. Tildá lo que esté bien.", persona: "Listo, la miro esta tarde." },
  ],
  review: [
    { agente: "«Review» significa «revisión». Comparo lo pedido con lo entregado.", persona: "¿Y si falta algo?" },
    { agente: "Te digo exactamente qué falta y a qué paso hay que volver.", persona: "¿Está todo?" },
    { agente: "Está todo: el aviso funciona y la lista se guarda bien.", persona: "Listo, terminamos." },
  ],
};

/** El documento que deja cada agente en su escritorio, sobre el mismo ejemplo de la lista de compras. */
export const DOCUMENTOS_DEMO: Record<AgenteId, Documento> = {
  refine: {
    titulo: "Brief: lista de compras de la casa",
    bloques: [
      { encabezado: "Quién la usa", lineas: ["La familia: cuatro personas y dos celulares."] },
      { encabezado: "Cómo se usa", lineas: ["Se abre en el celular, en el supermercado.", "Cada uno agrega lo que falta."] },
      { encabezado: "Qué queda afuera", lineas: ["Pagar en línea.", "Cuentas con contraseña."] },
    ],
  },
  generate: {
    titulo: "Los cuatro documentos del plan",
    bloques: [
      { encabezado: "Reglas del proyecto", lineas: ["Cada producto se guarda con nombre y cantidad.", "Nada se borra sin confirmar."] },
      { encabezado: "Historias de usuario", lineas: ["Quiero agregar un producto a la lista.", "Quiero tachar lo que ya compré."] },
      { encabezado: "Plan y tareas", lineas: ["Una página que anda en el celular.", "1. Agregar. 2. Tachar. 3. Compartir."] },
    ],
  },
  validate: {
    titulo: "Reporte de huecos",
    bloques: [
      { encabezado: "Lo que está cubierto", lineas: ["Agregar un producto: tiene historia y tarea.", "Tachar un producto: también."] },
      { encabezado: "Lo que falta", lineas: ["Nadie dijo qué pasa si dos agregan lo mismo.", "Falta una tarea para compartir la lista."] },
      { encabezado: "Qué hacer", lineas: ["Decidir los dos puntos antes de construir."] },
    ],
  },
  log: {
    titulo: "Registro de la decisión",
    bloques: [
      { encabezado: "Qué se decidió", lineas: ["Si dos agregan lo mismo, se suma la cantidad."] },
      { encabezado: "Las otras opciones", lineas: ["Dejar dos renglones repetidos.", "No dejar agregar el segundo."] },
      { encabezado: "Por qué esta", lineas: ["Sumar es lo que hace una persona con un papel."] },
      { encabezado: "Quién decidió", lineas: ["El equipo, en la reunión de hoy."] },
    ],
  },
  implement: {
    titulo: "Código y pruebas",
    bloques: [
      { encabezado: "Pruebas escritas primero", lineas: ["Agregar «leche» dos veces deja cantidad 2 ✔", "Tachar un producto no lo borra ✔", "La lista sigue ahí al cerrar ✔"] },
      { encabezado: "Resultado", lineas: ["Las nueve pruebas pasan: 9 de 9."] },
    ],
  },
  e2e: {
    titulo: "Evidencia del recorrido",
    bloques: [
      { encabezado: "El recorrido", lineas: ["Se abrió la lista en el celular.", "Se agregaron tres productos y se tacharon dos."] },
      { encabezado: "Lo que se comprobó", lineas: ["Los tachados siguen en la lista ✔", "Al recargar, todo sigue igual ✔"] },
    ],
  },
  checklist: {
    titulo: "Lista para mirar a mano",
    bloques: [
      { encabezado: "Para mirar", lineas: ["¿El botón de agregar se entiende solo?", "¿El texto se lee de pie en el supermercado?", "¿Se puede usar con una mano?"] },
      { encabezado: "Cómo se completa", lineas: ["Una persona de la casa la tilda. Ningún programa puede hacerlo."] },
    ],
  },
  review: {
    titulo: "Verificación final",
    bloques: [
      { encabezado: "Comparado", lineas: ["Lo pedido: una lista compartida, con cantidades.", "Lo entregado: una lista compartida, con cantidades."] },
      { encabezado: "Resultado", lineas: ["El trabajo está terminado.", "Nueve pruebas, un recorrido y una lista revisada a mano."] },
    ],
  },
};

/** Lo que dice Zac al empezar, antes de tocar nada. */
export const INTRO_DEMO: readonly { titulo: string; texto: string }[] = [
  { titulo: "Esta es la oficina", texto: "Ocho oficinas alrededor de un lobby. Cada una tiene un agente, y el trabajo va de la primera a la última." },
  { titulo: "La papelería", texto: "Está a la izquierda del lobby. Ahí se deja el brief: la idea escrita en pocas líneas, en un papel." },
  { titulo: "El brief es el punto de partida", texto: "Todo lo que sigue sale de ese papel. Si el papel está claro, los ocho pasos tienen a dónde ir." },
];

/** El cierre, cuando ya terminó el paso 8. */
export const CIERRE_DEMO: readonly { titulo: string; texto: string }[] = [
  { titulo: "Ocho pasos, una idea", texto: "El brief entró por la papelería y salió como una lista de compras construida, probada y revisada." },
  { titulo: "En cada paso la IA avisa y espera", texto: "Ningún agente decide solo: pregunta, muestra lo que hizo y espera que una persona lo apruebe." },
];
