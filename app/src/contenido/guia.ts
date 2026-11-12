import { AGENTES, type Estado } from "../flujo";
import { TEXTOS_AGENTES } from "./agentes";

/** La frase que acompaña a la persona en cada momento: qué tiene que hacer ahora. */
export function mensajeGuia(e: Estado): string {
  if (!e.briefDejado) {
    return "Primero dejá el brief: es la idea que vamos a trabajar. Está en la papelería, a la izquierda del lobby. Tocá la mesa para dejarlo.";
  }
  if (e.documentoAbierto !== null || e.fin) return "";

  const corriendo = e.agentes.findIndex((a) => a === "corriendo");
  if (corriendo !== -1) {
    const nombre = TEXTOS_AGENTES[AGENTES[corriendo].id].nombre;
    return `El agente ${AGENTES[corriendo].numero} (${nombre}) está trabajando. Su globito cuenta qué hace.`;
  }
  const habilitado = e.agentes.findIndex((a) => a === "habilitado");
  if (habilitado !== -1) {
    const agente = AGENTES[habilitado];
    const nombre = TEXTOS_AGENTES[agente.id].nombre;
    const anterior = habilitado > 0 ? " Antes podés leer el documento que dejó el agente anterior." : "";
    return `Ahora le toca al agente ${agente.numero} (${nombre}). Entrá a su oficina y ordenale correr.${anterior}`;
  }
  const terminado = e.agentes.findLastIndex((a) => a === "terminado");
  if (terminado !== -1) {
    const agente = AGENTES[terminado];
    return `El agente ${agente.numero} (${TEXTOS_AGENTES[agente.id].nombre}) terminó. Leé su documento sobre el escritorio.`;
  }
  return "";
}
