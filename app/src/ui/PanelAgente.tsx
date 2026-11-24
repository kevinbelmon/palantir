import { Fragment, useEffect, useRef, useState } from "react";
import { textosDe } from "../contenido";
import { AGENTES, type EstadoAgente } from "../flujo";

import { ANCHO_PANEL, estiloColumna } from "./columna";

export { ANCHO_PANEL };

export type MensajeChat = { rol: "agente" | "persona"; texto: string };

type Props = {
  indice: number;
  estado: EstadoAgente;
  briefDejado: boolean;
  alOrdenar: () => void;
  alCerrar: () => void;
  /** Lo que el agente fue haciendo de verdad (frases simples), si corre en un repo conectado. */
  actividad?: readonly string[];
  /** La conversación con el agente (solo con un repo conectado). */
  mensajes?: readonly MensajeChat[];
  /** Hay un turno en marcha: el agente está pensando o trabajando. */
  ocupado?: boolean;
  /** La persona le contesta al agente. */
  alEnviar?: (texto: string) => void;
  /** La persona da el paso por terminado y el brief pasa al siguiente. */
  alTerminar?: () => void;
  /** Abre el documento que dejó el agente (solo si ya terminó). */
  alLeer?: () => void;
  /** El agente está por escribir: se muestra «escribiendo…» con tres puntos. Lo usa el modo demo. */
  escribiendo?: boolean;
  /** Lo que ya está escrito en la caja, cuando el texto lo pone otro (el modo demo). */
  borrador?: string;
};

/** Negritas (**así**) y código (`así`) de lo que escribe el agente; el resto va tal cual, con sus saltos de línea. */
function Texto({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") && p.length > 4 ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : p.startsWith("`") && p.endsWith("`") && p.length > 2 ? (
          <code key={i} style={{ padding: "1px 6px", borderRadius: 0, background: "var(--superficie-fuerte)", fontSize: "0.92em" }}>
            {p.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** Las últimas cosas que hizo el agente. Sin registro real, muestra lo que cuenta su globito. */
function Hace({ lineas, cuenta, titulo }: { lineas?: readonly string[]; cuenta: string; titulo?: string }) {
  const ultimas = (lineas ?? []).slice(-6);
  return (
    <div style={{ margin: "0 0 12px" }}>
      {titulo && <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--texto-suave)", marginBottom: 6 }}>{titulo}</div>}
      {ultimas.length === 0 ? (
        <p style={{ margin: 0, color: "var(--texto-suave)" }}>{cuenta}</p>
      ) : (
        <ul aria-label="Lo que hace el agente" style={{ listStyle: "none", margin: 0, padding: "10px 14px", borderRadius: 0, background: "var(--superficie)", display: "flex", flexDirection: "column", gap: 4, fontSize: 13.5, maxHeight: 150, overflow: "auto" }}>
          {ultimas.map((l, i) => (
            <li key={i} style={{ color: i === ultimas.length - 1 ? "var(--texto)" : "var(--texto-suave)" }}>
              {l}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** El panel de la derecha: qué hace el agente que tocaste y, con un repo conectado, el chat donde te explica y te pregunta. */
export function PanelAgente({ indice, estado, briefDejado, alOrdenar, alCerrar, alLeer, actividad, mensajes, ocupado = false, alEnviar, alTerminar, escribiendo = false, borrador }: Props) {
  const agente = AGENTES[indice];
  const t = textosDe(agente.id);
  const anterior = indice > 0 ? textosDe(AGENTES[indice - 1].id).nombre : null;
  const hayChat = (mensajes?.length ?? 0) > 0 || (estado === "corriendo" && alEnviar !== undefined);
  const [respuesta, setRespuesta] = useState("");
  /** Lo que se ve en la caja: lo que escribe la persona, o lo que escribe el guion de la demo. */
  const enLaCaja = borrador ?? respuesta;
  const fin = useRef<HTMLDivElement>(null);

  // el chat baja solo hasta lo último que se dijo
  useEffect(() => {
    fin.current?.scrollIntoView?.({ block: "end" });
  }, [mensajes?.length, ocupado, actividad?.length]);

  const enviar = () => {
    const texto = respuesta.trim();
    if (!texto || ocupado || !alEnviar) return;
    alEnviar(texto);
    setRespuesta("");
  };

  return (
    <aside
      aria-label={`Agente ${agente.numero}: ${t.nombre}`}
      className="panel aparece"
      style={{ ...estiloColumna, padding: "20px 20px 16px", fontSize: 15, lineHeight: 1.55 }}
    >
      <button onClick={alCerrar} aria-label="Cerrar" className="btn btn-suave" style={{ position: "absolute", right: 14, top: 14, width: 32, height: 32, padding: 0, borderRadius: 0, fontSize: 16, lineHeight: 1 }}>
        ✕
      </button>
      <div style={{ fontSize: 12, color: "var(--texto-suave)", letterSpacing: "0.12em" }}>
        AGENTE {agente.numero} · {agente.comando}
      </div>
      <h2 style={{ margin: "4px 0 10px", fontSize: 22, fontWeight: 750, letterSpacing: "-0.01em", color: "var(--texto)" }}>
        {t.nombre} <span style={{ fontWeight: 400, fontSize: 15, color: "var(--texto-suave)" }}>· {t.subtitulo}</span>
      </h2>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
        {!hayChat && (
          <>
            <p style={{ margin: "0 0 6px" }}>{t.queHace}</p>
            <p style={{ margin: "0 0 14px", color: "var(--texto-suave)" }}>
              <strong style={{ color: "var(--texto)" }}>Para qué sirve:</strong> {t.paraQueSirve}
            </p>
          </>
        )}

        {hayChat && (
          <div role="log" aria-label="Conversación con el agente" style={{ display: "flex", flexDirection: "column", gap: 10, margin: "0 0 10px" }}>
            {(mensajes ?? []).map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.rol === "persona" ? "flex-end" : "flex-start",
                  maxWidth: "92%",
                  padding: "10px 14px",
                  borderRadius: m.rol === "persona" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.rol === "persona" ? "var(--acento)" : "var(--superficie)",
                  color: m.rol === "persona" ? "#fff" : "var(--texto)",
                  fontSize: 14.5,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                <Texto texto={m.texto} />
              </div>
            ))}
            {ocupado && (
              <div style={{ alignSelf: "flex-start", width: "100%" }}>
                <p style={{ margin: "0 0 6px", color: "var(--aviso)", fontWeight: 650, fontSize: 14 }}>Trabajando… esto es lo que está haciendo:</p>
                <Hace lineas={actividad} cuenta={t.globito} />
              </div>
            )}
            {escribiendo && (
              <div aria-label="El agente está escribiendo" style={{ alignSelf: "flex-start", padding: "12px 16px", background: "var(--superficie)" }}>
                <span className="puntos-escribiendo" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            <div ref={fin} />
          </div>
        )}

        {!hayChat && estado === "corriendo" && (
          <div>
            <p style={{ margin: "0 0 8px", color: "var(--aviso)", fontWeight: 650 }}>Trabajando… esto es lo que está haciendo:</p>
            <Hace lineas={actividad} cuenta={t.globito} />
          </div>
        )}
        {!hayChat && estado === "terminado" && (
          <>
            <p style={{ margin: "0 0 12px", color: "var(--ok)", fontWeight: 650 }}>Ya terminó. {t.listo}</p>
            {actividad && actividad.length > 0 && <Hace lineas={actividad} titulo="Lo que hizo" cuenta={t.globito} />}
          </>
        )}
        {hayChat && estado === "terminado" && <p style={{ margin: "0 0 8px", color: "var(--ok)", fontWeight: 650 }}>Ya terminó. {t.listo}</p>}
        {estado === "deshabilitado" && (
          <p style={{ margin: 0, color: "var(--error)" }}>
            {!briefDejado ? "Todavía no: primero dejá el brief en la papelería." : `Todavía no: primero tiene que terminar el agente anterior (${anterior}).`}
          </p>
        )}
      </div>

      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
        {estado === "habilitado" && (
          <button onClick={alOrdenar} className="btn">
            Ordenar que corra {agente.comando}
          </button>
        )}
        {estado === "corriendo" && alEnviar && (
          <>
            <textarea aria-label="Tu respuesta" className="campo" rows={2} value={enLaCaja} readOnly={borrador !== undefined} disabled={ocupado} onChange={(e) => setRespuesta(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), enviar())} placeholder={ocupado ? "Esperá a que termine de trabajar…" : "Escribí tu respuesta…"} style={{ resize: "none" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" style={{ flex: 1 }} disabled={ocupado || !enLaCaja.trim()} onClick={enviar}>
                Enviar
              </button>
              {alTerminar && (
                <button className="btn btn-suave" disabled={ocupado} onClick={alTerminar}>
                  Este paso está listo
                </button>
              )}
            </div>
          </>
        )}
        {estado === "terminado" && alLeer && (
          <button onClick={alLeer} className="btn">
            Leer lo que produjo
          </button>
        )}
      </div>
    </aside>
  );
}
