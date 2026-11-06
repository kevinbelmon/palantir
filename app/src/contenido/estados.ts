import { AGENTES, type EstadoAgente } from "../flujo";

export type ColorDeEstado = "gris" | "verde" | "amarillo" | "azul";

/** Cómo se muestra el estado de un agente: una palabra y un color (verde: te toca, amarillo: trabaja). */
export function etiquetaDeEstado(estado: EstadoAgente): { texto: string; color: ColorDeEstado } {
  switch (estado) {
    case "habilitado":
      return { texto: "Te toca", color: "verde" };
    case "corriendo":
      return { texto: "Trabajando", color: "amarillo" };
    case "terminado":
      return { texto: "Listo", color: "azul" };
    case "deshabilitado":
      return { texto: "En espera", color: "gris" };
  }
}

/** Lo que dice la etiqueta que flota sobre cada personaje: el nombre de su comando. */
export function textoEtiqueta(indice: number): string {
  return AGENTES[indice].comando;
}
