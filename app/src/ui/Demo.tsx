import { textosDe } from "../contenido";
import { DOCUMENTOS_DEMO } from "../contenido/demo";
import { AGENTES } from "../flujo";
import { PanelAgente } from "./PanelAgente";
import { ANCHO_PASOS } from "./PasoAPaso";
import { estiloColumna } from "./columna";
import { VELOCIDADES, reloj, type Demo } from "./demoReloj";

/** La marca del juego: los cuatro cuadrados de la barra de arriba. */
function Marca() {
  return (
    <div aria-hidden="true" style={{ display: "flex", gap: 5 }}>
      {["#5b8cff", "#8e6bff", "#3ecf6e", "#ffd54a"].map((c) => (
        <span key={c} style={{ width: 13, height: 13, background: c }} />
      ))}
    </div>
  );
}

/** La pantalla del principio: el título de la casa, qué se va a ver y cómo se maneja. */
function PantallaDeArranque({ alEmpezar, total }: { alEmpezar: () => void; total: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(14px, 4vh, 56px) 20px", overflow: "auto" }}>
      {/* el fondo: una grilla tenue de plano y un resplandor cálido, centrados y sin ninguna imagen */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(circle at 50% 50%, #000 22%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 22%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        style={{ position: "fixed", left: "50%", top: "50%", width: 760, height: 760, transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(255,213,74,0.13), rgba(0,0,0,0) 62%)" }}
      />

      <div className="aparece" style={{ position: "relative", width: "min(660px, 92vw)", display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(9px, 1.9vh, 20px)", textAlign: "center" }}>
        <Marca />
        <div>
          <div style={{ fontSize: "clamp(10px, 1.5vh, 11.5px)", letterSpacing: "0.34em", textTransform: "uppercase", color: "var(--aviso)" }}>Spec-Driven Development</div>
          <h1 style={{ margin: "clamp(8px, 1.4vh, 12px) 0 0", fontSize: "clamp(26px, 5.1vh, 46px)", lineHeight: 1.03, letterSpacing: "-0.035em", fontWeight: 800, color: "#f6f6f6" }}>
            La oficina
            <br />
            del modelo operativo
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: "clamp(13.5px, 1.95vh, 16px)", lineHeight: 1.6, color: "#a3a3a3", maxWidth: 470 }}>
          Ocho agentes, ocho pasos: de una idea escrita en un papel a un trabajo construido, probado y revisado. Se reproduce solo.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "0 14px", fontSize: "clamp(10px, 1.45vh, 11.5px)", letterSpacing: "0.14em", color: "#7d7d7d", rowGap: 6 }}>
          <span>{reloj(total)} DE RECORRIDO</span>
          <span aria-hidden="true" style={{ width: 1, height: 11, background: "#3a3a3a" }} />
          <span>SE PUEDE PAUSAR</span>
          <span aria-hidden="true" style={{ width: 1, height: 11, background: "#3a3a3a" }} />
          <span>SIN INTERNET</span>
        </div>
        <button onClick={alEmpezar} className="btn" style={{ marginTop: 4, padding: "clamp(9px, 1.5vh, 13px) 34px", fontSize: "clamp(13.5px, 1.9vh, 15px)", letterSpacing: "0.02em" }} autoFocus>
          Empezar la demo
        </button>
        <span style={{ fontSize: "clamp(10px, 1.4vh, 11.5px)", color: "#6d6d6d", lineHeight: 1.8 }}>Espacio pausa · ← → velocidad · R vuelve al principio · Esc detiene</span>
      </div>
    </div>
  );
}

/**
 * La explicación del paso, en una franja abajo del mapa (nunca encima): el plano se achica para dejarla
 * y la oficina queda siempre entera a la vista.
 */
function PanelZac({ narracion, actividad, corriendo, derecha }: { narracion: { titulo: string; texto: string } | null; actividad: readonly string[]; corriendo: boolean; derecha: number }) {
  if (!narracion) return null;
  const ahora = corriendo ? actividad[actividad.length - 1] : "";
  return (
    <aside
      role="complementary"
      aria-label="Zac, la explicación del paso"
      className="panel aparece"
      style={{ position: "absolute", left: ANCHO_PASOS + 14, right: derecha, bottom: 130, zIndex: 7, height: 76, display: "flex", alignItems: "center", gap: 16, padding: "0 18px", borderLeft: "3px solid var(--aviso)" }}
    >
      <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 3, maxWidth: 240 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--texto-suave)" }}>Zac · tu guía</span>
        <span style={{ fontSize: 15, fontWeight: 750, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{narracion.titulo}</span>
      </div>
      <span aria-hidden="true" style={{ flex: "none", width: 1, height: 40, background: "var(--superficie-fuerte)" }} />
      <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 15, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{narracion.texto}</p>
      {corriendo && actividad.length > 0 && (
        <div style={{ flex: "none", maxWidth: 300, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--aviso)", textAlign: "right" }}>
          <span className="latido" aria-hidden="true" style={{ width: 6, height: 6, background: "var(--ok)", flex: "none" }} />
          <span>{actividad[actividad.length - 1]}</span>
        </div>
      )}
    </aside>
  );
}

/** Pausa, velocidad y barra de avance: lo que hace falta para grabar tranquilo. */
function Controles({ demo }: { demo: Demo }) {
  const avance = demo.total > 0 ? Math.min(1, demo.tiempo / demo.total) : 0;
  const pausado = demo.pausada || demo.detenida;
  return (
    <div className="panel" style={{ position: "absolute", right: 20, top: 10, zIndex: 8, display: "flex", alignItems: "center", gap: 6, padding: "4px 6px" }}>
      <button onClick={demo.alternarPausa} className="btn btn-suave" aria-label={pausado ? "Seguir" : "Pausar"} aria-pressed={pausado} title="Espacio" style={{ width: 32, height: 26, padding: 0, display: "grid", placeItems: "center" }}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
          {pausado ? <path d="M7 4l13 8-13 8z" /> : <path d="M6 4h4v16H6zM14 4h4v16h-4z" />}
        </svg>
      </button>
      <button onClick={demo.reiniciar} className="btn btn-suave" aria-label="Volver al principio" title="R" style={{ width: 32, height: 26, padding: 0, display: "grid", placeItems: "center" }}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5" />
        </svg>
      </button>
      <div role="progressbar" aria-label="Avance de la demo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avance * 100)} style={{ width: 96, height: 3, margin: "0 2px", background: "var(--superficie-fuerte)" }}>
        <div style={{ width: `${avance * 100}%`, height: "100%", background: "var(--aviso)" }} />
      </div>
      <span style={{ fontSize: 12, color: "var(--texto-suave)", fontVariantNumeric: "tabular-nums", marginRight: 4, minWidth: 92 }}>
        {reloj(demo.tiempo)} / {reloj(demo.total)}
      </span>
      {VELOCIDADES.map((v) => {
        const activa = Math.abs(demo.velocidad - v) < 0.001;
        return (
          <button
            key={v}
            onClick={() => demo.cambiarVelocidad(v)}
            aria-pressed={activa}
            className="btn btn-suave"
            style={{ padding: "3px 7px", fontSize: 12, fontWeight: activa ? 800 : 600, color: activa ? "#000" : "var(--texto-suave)", background: activa ? "var(--aviso)" : "var(--superficie)" }}
          >
            {v === 1 ? "1×" : `${String(v).replace(".", ",")}×`}
          </button>
        );
      })}
    </div>
  );
}

/** El documento que dejó el agente, con el mismo aspecto que el visor del juego. */
function DocumentoDemo({ indice }: { indice: number }) {
  const t = textosDe(AGENTES[indice].id);
  const doc = DOCUMENTOS_DEMO[AGENTES[indice].id];
  return (
    <aside role="dialog" aria-label={`Documento de ${t.nombre}`} className="panel aparece" style={{ ...estiloColumna, padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 12, color: "var(--texto-suave)", letterSpacing: "0.12em" }}>{t.nombre.toUpperCase()} DEJÓ ESTO</div>
        <h2 style={{ margin: "4px 0 0", fontSize: 21, fontWeight: 750, letterSpacing: "-0.01em" }}>{doc.titulo}</h2>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {doc.bloques.map((b, i) => (
          <section key={i}>
            <h3 style={{ margin: "0 0 6px", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--texto-suave)" }}>{b.encabezado}</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {b.lineas.map((l, j) => (
                <li key={j} style={{ fontSize: 15, lineHeight: 1.5, color: "var(--texto)" }}>{l}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}

/** El cierre de la demo: repasa los ocho pasos con los documentos de esta corrida. */
function PanelFinalDemo() {
  return (
    <aside role="dialog" aria-label="Terminaste el recorrido" className="panel aparece" style={{ ...estiloColumna, padding: "22px 20px 18px" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 750, letterSpacing: "-0.02em" }}>¡Terminaste el recorrido!</h2>
      <p style={{ margin: "0 0 14px", color: "var(--texto-suave)", fontSize: 14.5 }}>Así viajó el brief por las ocho salas, de una idea suelta a un trabajo revisado:</p>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6, flex: 1, minHeight: 0, overflowY: "auto" }}>
        {AGENTES.map((a) => {
          const t = textosDe(a.id);
          return (
            <li key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 12px", background: "var(--superficie)" }}>
              <span style={{ flex: "none", width: 26, height: 26, background: "rgba(91,124,255,0.22)", color: "var(--acento)", fontWeight: 800, fontSize: 13, display: "grid", placeItems: "center" }}>{a.numero}</span>
              <span style={{ fontSize: 14 }}>
                <strong>{t.nombre}</strong> <span style={{ color: "var(--texto-suave)" }}>· {t.subtitulo}</span>
                <span style={{ display: "block", fontSize: 13, color: "var(--texto-suave)" }}>Dejó: {DOCUMENTOS_DEMO[a.id].titulo}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p style={{ margin: "14px 0 0", fontSize: 15, fontWeight: 650, color: "var(--aviso)" }}>Ocho pasos, de la idea al trabajo revisado.</p>
    </aside>
  );
}

/** Todo lo que la demo dibuja encima del juego: arranque, Zac, el panel del agente, sus documentos y los controles. */
export function DemoCapa({ demo }: { demo: Demo }) {
  const v = demo.vista;
  if (!demo.activo) return null;
  if (!demo.empezo) return <PantallaDeArranque alEmpezar={demo.empezar} total={demo.total} />;

  const seleccion = v.seleccion;
  const agente = seleccion !== null ? AGENTES[seleccion] : null;
  const corriendo = seleccion !== null && v.estado.agentes[seleccion] === "corriendo";

  return (
    <>
      <PanelZac narracion={v.narracion} actividad={v.actividad} corriendo={corriendo} />
      {v.columna === "agente" && seleccion !== null && agente && (
        <PanelAgente
          indice={seleccion}
          estado={v.estado.agentes[seleccion]}
          briefDejado={v.estado.briefDejado}
          alOrdenar={() => {}}
          alCerrar={() => {}}
          actividad={v.actividad}
          mensajes={v.chat[seleccion] ?? []}
          alEnviar={() => {}}
          escribiendo={v.escribiendo}
          borrador={v.borrador}
        />
      )}
      {v.columna === "documento" && v.estado.documentoAbierto !== null && <DocumentoDemo indice={v.estado.documentoAbierto} />}
      {v.columna === "final" && <PanelFinalDemo />}
      <Controles demo={demo} />
      {demo.pausada && !demo.detenida && (
        <div aria-live="polite" className="panel" style={{ position: "absolute", top: 20, left: ANCHO_PASOS + 14, zIndex: 9, padding: "6px 12px", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--aviso)" }}>
          En pausa
        </div>
      )}
      {demo.detenida && (
        <div className="panel" style={{ position: "absolute", top: 92, left: "50%", transform: "translateX(-50%)", zIndex: 9, padding: "8px 16px", fontSize: 13, color: "var(--texto-suave)", display: "flex", gap: 12, alignItems: "center" }}>
          Demo detenida
          <button onClick={demo.reiniciar} className="btn" style={{ padding: "4px 12px", fontSize: 12.5 }}>
            Volver a empezar
          </button>
        </div>
      )}
    </>
  );
}
