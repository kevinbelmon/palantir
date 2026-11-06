import { AGENTES, type Estado } from "../flujo";
import { TEXTOS_AGENTES } from "./agentes";

/** La frase que acompaña a la persona en cada momento: qué tiene que hacer ahora. */
export function mensajeGuia(e: Estado): string {
  if (!e.briefDejado) {
    return "Paso 1: dejá el brief en la papelería. Hacé clic en la mesa de la papelería (a la izquierda) para dejar la idea que vamos a trabajar.";
  }
  if (e.documentoAbierto !== null || e.fin) return "";

  const corriendo = e.agentes.findIndex((a) => a === "corriendo");
  if (corriendo !== -1) {
    const nombre = TEXTOS_AGENTES[AGENTES[corriendo].id].nombre;
    return `El agente ${AGENTES[corriendo].numero} (${nombre}) está trabajando. Mirá su globito y esperá a que termine.`;
  }
  const habilitado = e.agentes.findIndex((a) => a === "habilitado");
  if (habilitado !== -1) {
    const agente = AGENTES[habilitado];
    const nombre = TEXTOS_AGENTES[agente.id].nombre;
    const anterior = habilitado > 0 ? ` Antes, si querés, leé el documento que dejó el agente ${habilitado} sobre su escritorio.` : "";
    return `Ahora le toca al agente ${agente.numero} (${nombre}). Hacé clic en su escritorio y ordenale correr.${anterior}`;
  }
  const terminado = e.agentes.findLastIndex((a) => a === "terminado");
  if (terminado !== -1) {
    const agente = AGENTES[terminado];
    return `El agente ${agente.numero} (${TEXTOS_AGENTES[agente.id].nombre}) terminó. Hacé clic en el documento sobre su escritorio para leer lo que produjo.`;
  }
  return "";
}
