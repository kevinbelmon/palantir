import { useEffect, useReducer, useState } from "react";
import { mensajeGuia } from "./contenido";
import { DURACION_CORRIDA_MS, ESTADO_INICIAL, reducir, ubicacionBrief } from "./flujo";
import { crearReproductor } from "./musica";
import type { Elemento } from "./oficina";
import { Ayuda } from "./ui/Ayuda";
import { BarraSuperior } from "./ui/BarraSuperior";
import { BotonMusica } from "./ui/BotonMusica";
import { Guia } from "./ui/Guia";
import { Lienzo } from "./ui/Lienzo";
import { PanelAgente } from "./ui/PanelAgente";
import { PantallaFinal } from "./ui/PantallaFinal";
import { VisorDocumento } from "./ui/VisorDocumento";

export default function App() {
  const [estado, despachar] = useReducer(reducir, ESTADO_INICIAL);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [musica] = useState(() => crearReproductor());
  const [silenciada, setSilenciada] = useState(false);

  // la música arranca con el primer clic (o tecla) de la persona: antes, el navegador no la deja sonar
  useEffect(() => {
    const arrancar = () => musica.iniciar();
    window.addEventListener("pointerdown", arrancar, { once: true });
    window.addEventListener("keydown", arrancar, { once: true });
    return () => {
      window.removeEventListener("pointerdown", arrancar);
      window.removeEventListener("keydown", arrancar);
      musica.detener();
    };
  }, [musica]);

  const alternarMusica = () => {
    musica.silenciar(!silenciada);
    setSilenciada(!silenciada);
  };

  const alElegir = (el: Elemento) => {
    if (el.tipo === "papeleria") despachar({ tipo: "dejarBrief" });
    else if (el.tipo === "documento" && estado.agentes[el.indice] === "terminado") despachar({ tipo: "abrirDocumento", indice: el.indice });
    else setSeleccion(el.indice);
  };

  // el agente que corre termina solo, unos segundos después de que se le ordenó
  const corriendo = estado.agentes.findIndex((a) => a === "corriendo");
  useEffect(() => {
    if (corriendo === -1) return;
    const t = setTimeout(() => despachar({ tipo: "terminarCorrida", indice: corriendo }), DURACION_CORRIDA_MS);
    return () => clearTimeout(t);
  }, [corriendo]);

  return (
    <main style={{ height: "100%", position: "relative" }}>
      <Lienzo agentes={estado.agentes} brief={ubicacionBrief(estado)} alElegir={alElegir} />
      <BarraSuperior estado={estado} />
      <Guia mensaje={mensajeGuia(estado)} />
      {seleccion !== null && (
        <PanelAgente
          indice={seleccion}
          estado={estado.agentes[seleccion]}
          briefDejado={estado.briefDejado}
          alOrdenar={() => despachar({ tipo: "ordenarCorrer", indice: seleccion })}
          alCerrar={() => setSeleccion(null)}
          alLeer={() => despachar({ tipo: "abrirDocumento", indice: seleccion })}
        />
      )}
      {estado.documentoAbierto !== null && (
        <VisorDocumento indice={estado.documentoAbierto} alCerrar={() => despachar({ tipo: "cerrarDocumento" })} />
      )}
      {estado.fin && (
        <PantallaFinal
          alReiniciar={() => {
            setSeleccion(null);
            despachar({ tipo: "reiniciar" });
          }}
        />
      )}
      <BotonMusica silenciada={silenciada} alAlternar={alternarMusica} />
      <Ayuda />
    </main>
  );
}
