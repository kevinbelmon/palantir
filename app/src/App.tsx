import { useEffect, useReducer, useState } from "react";
import { crearCliente, SIN_CONEXION, type EstadoLocal } from "./conexion";
import { mensajeGuia } from "./contenido";
import { DURACION_CORRIDA_MS, ESTADO_INICIAL, reducir, ubicacionBrief } from "./flujo";
import { CANCIONES, cancionPorId, crearReproductor } from "./musica";
import type { Elemento } from "./oficina";
import { Dock } from "./ui/Dock";
import { BarraSuperior } from "./ui/BarraSuperior";
import { BotonMusica } from "./ui/BotonMusica";
import { Guia } from "./ui/Guia";
import { soportaWebGL } from "./escena";
import { Lienzo, type Enfoque } from "./ui/Lienzo";
import { Lienzo3D } from "./ui/Lienzo3D";
import { ANCHO_PANEL, PanelAgente } from "./ui/PanelAgente";
import { Archivos, BotonArchivos } from "./ui/Archivos";
import { BotonRepo, PanelRepo } from "./ui/PanelRepo";
import { ANCHO_PASOS, PasoAPaso } from "./ui/PasoAPaso";
import { PantallaFinal } from "./ui/PantallaFinal";
import { VisorDocumento } from "./ui/VisorDocumento";

/** La oficina en 3D; si el navegador no puede mostrar 3D, el mapa plano de siempre. */
const Mapa = soportaWebGL() ? Lienzo3D : Lienzo;

const CLAVE_CANCION = "sdd-juego-cancion";

/** La canción que eligió la persona la última vez (si el navegador lo permite). */
function cancionGuardada(): string {
  try {
    return localStorage.getItem(CLAVE_CANCION) ?? "";
  } catch {
    return "";
  }
}

export default function App() {
  const [estado, despachar] = useReducer(reducir, ESTADO_INICIAL);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [enfoque, setEnfoque] = useState<Enfoque | null>(null);
  const [pasoAbierto, setPasoAbierto] = useState<number | null>(null);
  const [cliente] = useState(() => crearCliente());
  const [local, setLocal] = useState<EstadoLocal>(SIN_CONEXION);
  const [repoAbierto, setRepoAbierto] = useState(false);
  const [archivosAbierto, setArchivosAbierto] = useState(false);
  const [aviso, setAviso] = useState("");
  const real = local.briefSubido;
  const [ocupado, setOcupado] = useState(false);

  // al abrir el juego, si el programa local ya tiene un repo (el último que se usó), se retoma donde se dejó
  useEffect(() => {
    let vivo = true;
    cliente
      .estado()
      .then((e) => {
        if (!vivo || !e.repo) return;
        setLocal(e);
        if (e.progreso) despachar({ tipo: "restaurar", estado: e.progreso });
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [cliente]);

  // cada cambio del avance se guarda por repo, para que el juego se acuerde en qué paso está
  useEffect(() => {
    if (!local.modeloInstalado) return;
    const t = setTimeout(() => {
      cliente.guardarProgreso(estado).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [estado, local.modeloInstalado, cliente]);

  // al conectar otro repo: se retoma su avance guardado, o se empieza de cero
  const alCambiarLocal = (e: EstadoLocal) => {
    if (e.repo !== local.repo) {
      if (e.progreso) despachar({ tipo: "restaurar", estado: e.progreso });
      else despachar({ tipo: "reiniciar" });
      setSeleccion(null);
      setPasoAbierto(null);
      setEnfoque(null);
    }
    setLocal(e);
  };
  const [musica] = useState(() => {
    const m = crearReproductor();
    m.cambiar(cancionGuardada());
    return m;
  });
  const [cancion, setCancion] = useState(() => cancionPorId(cancionGuardada()).id);
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

  const elegirCancion = (id: string) => {
    musica.cambiar(id);
    setCancion(id);
    try {
      localStorage.setItem(CLAVE_CANCION, id);
    } catch {
      /* sin almacenamiento: la elección vale hasta cerrar la página */
    }
    if (silenciada) {
      musica.silenciar(false);
      setSilenciada(false);
    }
  };

  const alternarMusica = () => {
    musica.silenciar(!silenciada);
    setSilenciada(!silenciada);
  };

  const alElegir = (el: Elemento) => {
    if (el.tipo === "papeleria") despachar({ tipo: "dejarBrief" });
    else if (el.tipo === "documento" && estado.agentes[el.indice] === "terminado") despachar({ tipo: "abrirDocumento", indice: el.indice });
    else setSeleccion(el.indice);
  };

  // sin repo conectado, el agente que corre termina solo, unos segundos después de que se le ordenó
  const corriendo = estado.agentes.findIndex((a) => a === "corriendo");
  useEffect(() => {
    if (corriendo === -1 || real) return;
    const t = setTimeout(() => despachar({ tipo: "terminarCorrida", indice: corriendo }), DURACION_CORRIDA_MS);
    return () => clearTimeout(t);
  }, [corriendo, real]);

  // se le ordena a un agente que corra. Con un repo conectado corre de verdad: se presenta y, si necesita algo,
  // pregunta en el chat; el paso se da por listo desde ahí
  const ordenar = (indice: number) => {
    despachar({ tipo: "ordenarCorrer", indice });
    if (!real) return;
    setOcupado(true);
    cliente
      .correrAgente(indice)
      .then(setLocal)
      .catch((e: unknown) => {
        setAviso(e instanceof Error ? e.message : "Algo salió mal.");
        despachar({ tipo: "cancelarCorrida", indice });
      })
      .finally(() => setOcupado(false));
  };

  // mientras hay un turno en marcha, se le pregunta cada tanto al programa local qué va haciendo el agente
  useEffect(() => {
    if (!ocupado) return;
    const t = setInterval(() => {
      cliente
        .estado()
        .then((e) => setLocal((previo) => ({ ...previo, actividad: e.actividad })))
        .catch(() => {});
    }, 1500);
    return () => clearInterval(t);
  }, [ocupado, cliente]);

  // la persona le contesta al agente: su mensaje se ve enseguida y el agente sigue la misma conversación
  const enviarAlAgente = (indice: number, texto: string) => {
    setOcupado(true);
    setLocal((p) => ({ ...p, chat: { ...p.chat, [String(indice)]: [...(p.chat[String(indice)] ?? []), { rol: "persona", texto }] } }));
    cliente
      .enviarMensaje(indice, texto)
      .then(setLocal)
      .catch((e: unknown) => {
        setAviso(e instanceof Error ? e.message : "Algo salió mal.");
        cliente.estado().then(setLocal).catch(() => {});
      })
      .finally(() => setOcupado(false));
  };

  return (
    <main style={{ height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, left: ANCHO_PASOS, right: seleccion !== null ? ANCHO_PANEL : 0 }}>
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
          alOrdenar={() => ordenar(seleccion)}
          alCerrar={() => setSeleccion(null)}
          alLeer={() => despachar({ tipo: "abrirDocumento", indice: seleccion })}
          actividad={real ? local.actividad[String(seleccion)] : undefined}
          mensajes={real ? (local.chat[String(seleccion)] ?? (local.salidas[String(seleccion)] ? [{ rol: "agente" as const, texto: local.salidas[String(seleccion)] }] : undefined)) : undefined}
          ocupado={ocupado && corriendo === seleccion}
          alEnviar={real ? (texto) => enviarAlAgente(seleccion, texto) : undefined}
          alTerminar={real ? () => despachar({ tipo: "terminarCorrida", indice: seleccion }) : undefined}
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
      <BotonMusica silenciada={silenciada} alAlternar={alternarMusica} canciones={CANCIONES} actual={cancion} alElegir={elegirCancion} />
      {local.modeloInstalado && <BotonArchivos alAbrir={() => setArchivosAbierto(true)} />}
      <BotonRepo conectado={local.briefSubido} alAbrir={() => setRepoAbierto(true)} />
      {archivosAbierto && <Archivos cliente={cliente} alCerrar={() => setArchivosAbierto(false)} />}
      {repoAbierto && <PanelRepo estado={local} cliente={cliente} alCambiar={alCambiarLocal} alCerrar={() => setRepoAbierto(false)} />}
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
