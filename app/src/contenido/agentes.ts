import type { AgenteId } from "../flujo";

/** Lo que dicen los carteles, las pizarras y los globitos de cada agente. Todo en español simple. */
export type TextoAgente = {
  nombre: string;
  subtitulo: string;
  pizarra: readonly [string, string, string];
  /** Lo que cuenta el agente mientras trabaja (primera persona). */
  globito: string;
  /** Qué significa el nombre del comando y qué hace. */
  queHace: string;
  paraQueSirve: string;
  /** Lo que dice al terminar. */
  listo: string;
};

export const TEXTOS_AGENTES: Record<AgenteId, TextoAgente> = {
  refine: {
    nombre: "Refine",
    subtitulo: "Pulir el pedido",
    pizarra: ["Entender el pedido", "Hacer preguntas", "Dejar el brief claro"],
    globito: "Estoy leyendo el brief y haciendo preguntas hasta que quede clarísimo qué hay que construir.",
    queHace: "«Refine» significa «pulir». Toma la idea del brief y la deja clara, sin dudas, preguntando lo que falte.",
    paraQueSirve: "Sirve para que nadie construya algo distinto de lo que se pidió. Es el primer paso de todo proyecto.",
    listo: "¡Listo! Dejé el pedido bien claro. Mirá el documento sobre mi escritorio.",
  },
  generate: {
    nombre: "Generate",
    subtitulo: "Armar el plan",
    pizarra: ["Reglas del proyecto", "Historias de usuario", "Pasos a seguir"],
    globito: "Armo el plan: las reglas del proyecto, las historias de usuario y la lista de pasos para construirlo.",
    queHace: "«Generate» significa «generar». A partir del brief pulido arma cuatro documentos cortos: reglas, historias, plan y tareas.",
    paraQueSirve: "Sirve para que todo el equipo tenga el mismo mapa antes de empezar a construir.",
    listo: "¡Listo! El plan está armado. Mirá los documentos sobre mi escritorio.",
  },
  validate: {
    nombre: "Validate",
    subtitulo: "Buscar huecos",
    pizarra: ["Comparar con el pedido", "Marcar lo que falta", "Avisar al equipo"],
    globito: "Comparo el plan con el pedido original para ver si falta algo o si algo no tiene sentido.",
    queHace: "«Validate» significa «validar». Revisa que el plan cubra todo lo que se pidió y marca los huecos.",
    paraQueSirve: "Sirve para encontrar los errores cuando todavía es barato arreglarlos: antes de construir.",
    listo: "¡Listo! Encontré un par de huecos. Mirá el reporte sobre mi escritorio.",
  },
  log: {
    nombre: "Log",
    subtitulo: "Dejar constancia",
    pizarra: ["Anotar la decisión", "Explicar el por qué", "Guardar el registro"],
    globito: "Anoto la decisión que se tomó y explico por qué, para que quede registrada y nadie la olvide.",
    queHace: "«Log» significa «registro». Cuando el equipo decide algo que cambia el plan, lo deja escrito: qué, por qué y quién.",
    paraQueSirve: "Sirve para que, meses después, cualquiera entienda por qué se hizo así y no de otra manera.",
    listo: "¡Listo! La decisión quedó anotada. Mirá el registro sobre mi escritorio.",
  },
  implement: {
    nombre: "Implement",
    subtitulo: "Construir",
    pizarra: ["Escribir las pruebas", "Escribir el código", "Chequear que anda"],
    globito: "Escribo primero las pruebas y después el código, y chequeo que todo funcione como se pidió.",
    queHace: "«Implement» significa «construir». Escribe el programa siguiendo el plan, y lo prueba a medida que avanza.",
    paraQueSirve: "Sirve para convertir el plan en una aplicación que funciona, con pruebas que avisan si algo se rompe.",
    listo: "¡Listo! La aplicación está construida y las pruebas pasan. Mirá el resultado sobre mi escritorio.",
  },
  e2e: {
    nombre: "E2E",
    subtitulo: "Probar de punta a punta",
    pizarra: ["Abrir la aplicación", "Hacer el recorrido", "Guardar la evidencia"],
    globito: "Abro la aplicación como lo haría una persona y hago el recorrido completo, guardando cada captura.",
    queHace: "«E2E» significa «de punta a punta». Usa la aplicación de verdad, de principio a fin, como un usuario.",
    paraQueSirve: "Sirve para comprobar que todo funciona junto, y deja evidencia de que se probó.",
    listo: "¡Listo! Hice todo el recorrido y guardé la evidencia. Mirala sobre mi escritorio.",
  },
  checklist: {
    nombre: "Checklist",
    subtitulo: "Revisión humana",
    pizarra: ["Lista de chequeo", "Mirar como persona", "Tildar lo que está bien"],
    globito: "Miro lo que solo una persona puede juzgar, como si se entiende un botón, y armo la lista para tildar.",
    queHace: "«Checklist» significa «lista de chequeo». Arma una lista de cosas para revisar a mano y la completa una persona.",
    paraQueSirve: "Sirve para revisar lo que no se puede medir con un programa: si se entiende, si se ve bien, si es cómodo.",
    listo: "¡Listo! La lista está armada. Mirala sobre mi escritorio y tildá lo que esté bien.",
  },
  review: {
    nombre: "Review",
    subtitulo: "Revisión final",
    pizarra: ["Repasar todo", "Confirmar que cumple", "Dar el visto bueno"],
    globito: "Repaso todo el recorrido: el pedido, el plan, el código, las pruebas y la lista, para dar el visto bueno final.",
    queHace: "«Review» significa «revisión». Es el último control: confirma que lo que se construyó cumple lo que se pidió.",
    paraQueSirve: "Sirve para decidir si el trabajo está terminado, con todas las pruebas a la vista.",
    listo: "¡Listo! Todo cumple lo pedido. Mirá la verificación final sobre mi escritorio.",
  },
};

export function textosDe(id: AgenteId): TextoAgente {
  return TEXTOS_AGENTES[id];
}
