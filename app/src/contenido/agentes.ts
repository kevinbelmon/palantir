import type { AgenteId } from "../flujo";

/** Lo que dicen los carteles y las pizarras de cada sala. Todo en español simple. */
export type TextoAgente = {
  nombre: string;
  subtitulo: string;
  pizarra: readonly [string, string, string];
};

export const TEXTOS_AGENTES: Record<AgenteId, TextoAgente> = {
  refine: { nombre: "Refine", subtitulo: "Pulir el pedido", pizarra: ["Entender el pedido", "Hacer preguntas", "Dejar el brief claro"] },
  generate: { nombre: "Generate", subtitulo: "Armar el plan", pizarra: ["Reglas del proyecto", "Historias de usuario", "Pasos a seguir"] },
  validate: { nombre: "Validate", subtitulo: "Buscar huecos", pizarra: ["Comparar con el pedido", "Marcar lo que falta", "Avisar al equipo"] },
  log: { nombre: "Log", subtitulo: "Dejar constancia", pizarra: ["Anotar la decisión", "Explicar el por qué", "Guardar el registro"] },
  implement: { nombre: "Implement", subtitulo: "Construir", pizarra: ["Escribir las pruebas", "Escribir el código", "Chequear que anda"] },
  e2e: { nombre: "E2E", subtitulo: "Probar de punta a punta", pizarra: ["Abrir la aplicación", "Hacer el recorrido", "Guardar la evidencia"] },
  checklist: { nombre: "Checklist", subtitulo: "Revisión humana", pizarra: ["Lista de chequeo", "Mirar como persona", "Tildar lo que está bien"] },
  review: { nombre: "Review", subtitulo: "Revisión final", pizarra: ["Repasar todo", "Confirmar que cumple", "Dar el visto bueno"] },
};

export function textosDe(id: AgenteId): TextoAgente {
  return TEXTOS_AGENTES[id];
}
