import { AGENTES, type Estado } from "../flujo";
import { TEXTOS_AGENTES } from "./agentes";

/** La frase que acompaña a la persona en cada momento: qué tiene que hacer ahora. */
export function mensajeGuia(e: Estado): string {
  if (!e.briefDejado) {
    return "Paso 1: dejá el brief en la papelería. Hacé clic en la mesa de la papelería (a la izquierda) para dejar la idea que vamos a trabajar.";
  }
  const habilitado = e.agentes.findIndex((a) => a === "habilitado");
  if (habilitado !== -1) {
    const agente = AGENTES[habilitado];
    const nombre = TEXTOS_AGENTES[agente.id].nombre;
    return `Ahora le toca al agente ${agente.numero} (${nombre}). Hacé clic en su escritorio y ordenale correr.`;
  }
  return "";
}
