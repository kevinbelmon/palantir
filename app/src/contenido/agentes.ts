import type { AgenteId } from "../flujo";
import { DOCUMENTOS, type Documento } from "./documentos";

/** Lo que dicen los carteles, las pizarras y los globitos de cada agente. Todo en español simple. */
export type TextoAgente = {
  nombre: string;
  subtitulo: string;
  /** Una sola frase corta de para qué sirve, para el panel «Paso a paso». */
  resumen: string;
  pizarra: readonly [string, string, string];
  /** Lo que cuenta el agente mientras trabaja (primera persona). */
  globito: string;
  /** Qué significa el nombre del comando y qué hace. */
  queHace: string;
  paraQueSirve: string;
  /** Lo que dice al terminar. */
  listo: string;
  /** El documento (simplificado) que deja sobre su escritorio. */
  documento: Documento;
};

const BASE: Record<AgenteId, Omit<TextoAgente, "documento">> = {
  refine: {
    nombre: "Refine",
    resumen: "Pule el pedido y hace las preguntas que faltan, hasta que no quede ninguna duda.",
    subtitulo: "Pulir el pedido",
    pizarra: ["Leer el brief", "Preguntar lo que falta", "Dejar el pedido claro"],
    globito: "Estoy leyendo el brief y anotando las preguntas que todavía no tienen respuesta.",
    queHace: "«Refine» significa «pulir». Lee el brief, pregunta lo que falta y deja el pedido escrito sin dudas.",
    paraQueSirve: "Sirve para que nadie construya una cosa distinta de la que se pidió.",
    listo: "Terminé. El pedido quedó claro. Está en el brief pulido sobre mi escritorio.",
  },
  generate: {
    nombre: "Generate",
    resumen: "Arma cuatro documentos cortos con las reglas, las historias, el plan y las tareas.",
    subtitulo: "Armar el plan",
    pizarra: ["Reglas del proyecto", "Historias de usuario", "Plan y tareas"],
    globito: "Armo cuatro documentos cortos: las reglas, las historias de usuario, el plan y la lista de tareas.",
    queHace: "«Generate» significa «generar». Convierte el brief en cuatro documentos: reglas, historias de usuario, plan y tareas.",
    paraQueSirve: "Sirve para que todo el equipo mire el mismo mapa antes de empezar a construir.",
    listo: "Terminé. Los cuatro documentos del plan están sobre mi escritorio.",
  },
  validate: {
    nombre: "Validate",
    resumen: "Compara el plan con el pedido y escribe lo que quedó sin cubrir.",
    subtitulo: "Buscar huecos",
    pizarra: ["Comparar con el pedido", "Marcar lo que falta", "Avisar antes de construir"],
    globito: "Comparo el plan con el pedido original y anoto lo que quedó sin cubrir.",
    queHace: "«Validate» significa «validar». Compara el plan con el pedido y anota lo que no está cubierto.",
    paraQueSirve: "Sirve para encontrar los huecos cuando arreglarlos todavía es barato: antes de construir.",
    listo: "Terminé. Encontré dos huecos. El reporte está sobre mi escritorio.",
  },
  log: {
    nombre: "Log",
    resumen: "Anota qué se decidió, por qué y quién, para no olvidarlo después.",
    subtitulo: "Dejar constancia",
    pizarra: ["Qué se decidió", "Por qué se decidió", "Quién lo decidió"],
    globito: "Anoto la decisión de hoy y su motivo, para que dentro de seis meses nadie tenga que adivinar.",
    queHace: "«Log» significa «registro». Deja escrito qué se decidió, por qué y quién lo decidió.",
    paraQueSirve: "Sirve para entender una decisión meses después, sin depender de la memoria de nadie.",
    listo: "Terminé. La decisión quedó anotada. El registro está sobre mi escritorio.",
  },
  implement: {
    nombre: "Implement",
    resumen: "Escribe las pruebas y después el programa, hasta que todo pasa.",
    subtitulo: "Construir",
    pizarra: ["Escribir las pruebas", "Escribir el programa", "Ver las pruebas pasar"],
    globito: "Escribo primero las pruebas, después el programa, y repito hasta que todas pasan.",
    queHace: "«Implement» significa «construir». Escribe el programa que pide el plan, junto con sus pruebas.",
    paraQueSirve: "Sirve para pasar del plan a una aplicación que funciona, y que avisa si algo se rompe.",
    listo: "Terminé. La aplicación está construida y las doce pruebas pasan. Está todo sobre mi escritorio.",
  },
  e2e: {
    nombre: "E2E",
    resumen: "Usa la aplicación de verdad, de principio a fin, y guarda la prueba.",
    subtitulo: "Probar el recorrido",
    pizarra: ["Abrir la aplicación", "Hacer el recorrido", "Guardar la evidencia"],
    globito: "Abro la aplicación como lo haría una persona y hago el recorrido completo, guardando cada captura.",
    queHace: "«E2E» significa «de punta a punta». Usa la aplicación de verdad, de principio a fin, como una persona.",
    paraQueSirve: "Sirve para comprobar que todas las partes funcionan juntas, y deja la prueba guardada.",
    listo: "Terminé. Hice el recorrido completo y guardé tres capturas.",
  },
  checklist: {
    nombre: "Checklist",
    resumen: "Arma la lista de lo que solo una persona puede juzgar: si se entiende y se ve bien.",
    subtitulo: "Revisión a mano",
    pizarra: ["Mirar como una persona", "Armar la lista", "Tildar lo que está bien"],
    globito: "Miro lo que solo una persona puede juzgar, como si un botón se entiende, y armo la lista para tildar.",
    queHace: "«Checklist» significa «lista de chequeo». Arma la lista de lo que hay que mirar a mano y la completa una persona.",
    paraQueSirve: "Sirve para revisar lo que un programa no puede medir: si se entiende, si se ve bien, si es cómodo.",
    listo: "Terminé. La lista está sobre mi escritorio: tildá lo que esté bien.",
  },
  review: {
    nombre: "Review",
    resumen: "Compara lo pedido con lo entregado y decide si el trabajo está terminado.",
    subtitulo: "Visto bueno",
    pizarra: ["Repasar el pedido", "Comparar con lo entregado", "Dar el visto bueno"],
    globito: "Repaso el pedido, el plan, las pruebas y la lista, y decido si el trabajo está terminado.",
    queHace: "«Review» significa «revisión». Compara lo que se pidió con lo que se entregó y decide si está terminado.",
    paraQueSirve: "Sirve para cerrar el trabajo con todas las pruebas a la vista, sin sorpresas.",
    listo: "Terminé. Todo cumple lo pedido. La verificación final está sobre mi escritorio.",
  },
};

export const TEXTOS_AGENTES = Object.fromEntries(
  (Object.keys(BASE) as AgenteId[]).map((id) => [id, { ...BASE[id], documento: DOCUMENTOS[id] }]),
) as Record<AgenteId, TextoAgente>;

export function textosDe(id: AgenteId): TextoAgente {
  return TEXTOS_AGENTES[id];
}
