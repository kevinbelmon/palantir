import { AGENTES, type EstadoAgente } from "./flujo";
import { Ayuda } from "./ui/Ayuda";
import { Lienzo } from "./ui/Lienzo";

const TODOS_DESHABILITADOS: readonly EstadoAgente[] = AGENTES.map(() => "deshabilitado");

export default function App() {
  return (
    <main style={{ height: "100%", position: "relative" }}>
      <Lienzo agentes={TODOS_DESHABILITADOS} brief="mano" />
      <Ayuda />
    </main>
  );
}
