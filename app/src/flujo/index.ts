// Interfaz pública de flujo: el estado del juego y los agentes.
export { AGENTES } from "./agentes";
export type { Agente, AgenteId, EstadoAgente, UbicacionBrief } from "./agentes";
export { DURACION_CORRIDA_MS, ESTADO_INICIAL, reducir, ubicacionBrief } from "./estado";
export type { Accion, Estado } from "./estado";
