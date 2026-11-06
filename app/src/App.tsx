import { useReducer } from "react";
import { mensajeGuia } from "./contenido";
import { ESTADO_INICIAL, reducir, ubicacionBrief } from "./flujo";
import type { Elemento } from "./oficina";
import { Ayuda } from "./ui/Ayuda";
import { Guia } from "./ui/Guia";
import { Lienzo } from "./ui/Lienzo";

export default function App() {
  const [estado, despachar] = useReducer(reducir, ESTADO_INICIAL);

  const alElegir = (el: Elemento) => {
    if (el.tipo === "papeleria") despachar({ tipo: "dejarBrief" });
  };

  return (
    <main style={{ height: "100%", position: "relative" }}>
      <Lienzo agentes={estado.agentes} brief={ubicacionBrief(estado)} alElegir={alElegir} />
      <Guia mensaje={mensajeGuia(estado)} />
      <Ayuda />
    </main>
  );
}
