import { useEffect, useReducer, useState } from "react";
import { crearCliente, SIN_CONEXION, type EstadoLocal } from "./conexion";
import { mensajeGuia } from "./contenido";
import { DURACION_CORRIDA_MS, ESTADO_INICIAL, reducir, ubicacionBrief } from "./flujo";
import { crearReproductor } from "./musica";
import type { Elemento } from "./oficina";
import { Dock } from "./ui/Dock";
import { BarraSuperior } from "./ui/BarraSuperior";
import { BotonMusica } from "./ui/BotonMusica";
import { Guia } from "./ui/Guia";
import { soportaWebGL } from "./escena";
import { Lienzo, type Enfoque } from "./ui/Lienzo";
import { Lienzo3D } from "./ui/Lienzo3D";
import { PanelAgente } from "./ui/PanelAgente";
import { BotonRepo, PanelRepo } from "./ui/PanelRepo";
import { ANCHO_PASOS, PasoAPaso } from "./ui/PasoAPaso";
import { PantallaFinal } from "./ui/PantallaFinal";
import { VisorDocumento } from "./ui/VisorDocumento";

/** La oficina en 3D; si el navegador no puede mostrar 3D, el mapa plano de siempre. */
const Mapa = soportaWebGL() ? Lienzo3D : Lienzo;

export default function App() {
  const [estado, despachar] = useReducer(reducir, ESTADO_INICIAL);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [enfoque, setEnfoque] = useState<Enfoque | null>(null);
  const [pasoAbierto, setPasoAbierto] = useState<number | null>(null);
  const [cliente] = useState(() => crearCliente());
  const [local, setLocal] = useState<EstadoLocal>(SIN_CONEXION);
  const [repoAbierto, setRepoAbierto] = useState(false);
  const [aviso, setAviso] = useState("");
  const real = local.briefSubido;
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
    if (!real) {
      const t = setTimeout(() => despachar({ tipo: "terminarCorrida", indice: corriendo }), DURACION_CORRIDA_MS);
      return () => clearTimeout(t);
    }
    // con un repo conectado el agente corre de verdad: se espera lo que conteste el programa local
    let vivo = true;
    cliente
      .correrAgente(corriendo)
      .then((r) => {
        if (!vivo) return;
        setLocal(r);
        despachar({ tipo: "terminarCorrida", indice: corriendo });
      })
      .catch((e: unknown) => {
        if (!vivo) return;
        setAviso(e instanceof Error ? e.message : "Algo salió mal.");
        despachar({ tipo: "cancelarCorrida", indice: corriendo });
      });
    return () => {
      vivo = false;
    };
  }, [corriendo, real, cliente]);

  return (
    <main style={{ height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, left: ANCHO_PASOS }}>
        <Mapa agentes={estado.agentes} brief={ubicacionBrief(estado)} alElegir={alElegir} enfoque={enfoque} />
      </div>
      <PasoAPaso
        estado={estado}
        abierto={pasoAbierto}
        alElegir={(i) => {
          setPasoAbierto(pasoAbierto === i ? null : i);
          setEnfoque({ indice: i, vez: Date.now() });
        }}
      />
      <BarraSuperior estado={estado} />
      <Guia mensaje={seleccion === null ? mensajeGuia(estado) : ""} />
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
        <VisorDocumento indice={estado.documentoAbierto} alCerrar={() => despachar({ tipo: "cerrarDocumento" })} real={real ? (local.salidas[String(estado.documentoAbierto)] ?? "") : undefined} />
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
      <BotonRepo conectado={local.briefSubido} alAbrir={() => setRepoAbierto(true)} />
      {repoAbierto && <PanelRepo estado={local} cliente={cliente} alCambiar={setLocal} alCerrar={() => setRepoAbierto(false)} />}
      {aviso && (
        <div role="alert" className="panel aparece" style={{ position: "absolute", top: 76, left: "50%", transform: "translateX(-50%)", zIndex: 9, maxWidth: 560, padding: "12px 14px 12px 20px", borderRadius: 16, color: "var(--error)", fontSize: 14.5, display: "flex", gap: 14, alignItems: "center" }}>
          <span>{aviso}</span>
          <button onClick={() => setAviso("")} className="btn btn-suave" style={{ padding: "6px 14px" }}>
            Cerrar
          </button>
        </div>
      )}
      <Dock
        estado={estado}
        alElegir={(i) => {
          setSeleccion(i);
          setEnfoque({ indice: i, vez: Date.now() });
        }}
        alNuevo={() => {
          setSeleccion(null);
          setEnfoque(null);
          setPasoAbierto(null);
          despachar({ tipo: "reiniciar" });
        }}
      />
    </main>
  );
}
