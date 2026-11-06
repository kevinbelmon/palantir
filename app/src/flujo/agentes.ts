export type AgenteId = "refine" | "generate" | "validate" | "log" | "implement" | "e2e" | "checklist" | "review";

export type Agente = { id: AgenteId; numero: number; comando: string };

/** Estado de un agente durante el juego. */
export type EstadoAgente = "deshabilitado" | "habilitado" | "corriendo" | "terminado";

/** Los 8 agentes del camino principal del modelo, en el orden del ciclo. */
export const AGENTES: readonly Agente[] = [
  { id: "refine", numero: 1, comando: "/sdd-refine" },
  { id: "generate", numero: 2, comando: "/sdd-generate" },
  { id: "validate", numero: 3, comando: "/sdd-validate" },
  { id: "log", numero: 4, comando: "/sdd-log" },
  { id: "implement", numero: 5, comando: "/sdd-implement" },
  { id: "e2e", numero: 6, comando: "/sdd-e2e" },
  { id: "checklist", numero: 7, comando: "/sdd-checklist" },
  { id: "review", numero: 8, comando: "/sdd-review" },
];

/** Dónde está el brief: en la mano de la persona, en la papelería, o en el escritorio de un agente (0 a 7). */
export type UbicacionBrief = "mano" | "papeleria" | { agente: number };
