import { textosDe } from "../contenido";
import { AGENTES, type EstadoAgente } from "../flujo";

type Props = {
  indice: number;
  estado: EstadoAgente;
  briefDejado: boolean;
  alOrdenar: () => void;
  alCerrar: () => void;
  /** Lo que el agente fue haciendo de verdad (frases simples), si corre en un repo conectado. */
  actividad?: readonly string[];
  /** Abre el documento que dejó el agente (solo si ya terminó). */
  alLeer?: () => void;
};

const claseBoton = "btn";

/** Las últimas cosas que hizo el agente. Sin registro real, muestra lo que cuenta su globito. */
function Hace({ lineas, cuenta, titulo }: { lineas?: readonly string[]; cuenta: string; titulo?: string }) {
  const ultimas = (lineas ?? []).slice(-8);
  return (
    <div style={{ margin: "0 0 14px" }}>
      {titulo && <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--texto-suave)", marginBottom: 6 }}>{titulo}</div>}
      {ultimas.length === 0 ? (
        <p style={{ margin: 0, color: "#c4c8e8" }}>{cuenta}</p>
      ) : (
        <ul aria-label="Lo que hace el agente" style={{ listStyle: "none", margin: 0, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 4, fontSize: 14, maxHeight: 190, overflow: "auto" }}>
          {ultimas.map((l, i) => (
            <li key={i} style={{ color: i === ultimas.length - 1 ? "#fff" : "var(--texto-suave)" }}>
              {l}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Lo que se ve al tocar un agente: qué hace, para qué sirve, y qué se le puede ordenar ahora. */
export function PanelAgente({ indice, estado, briefDejado, alOrdenar, alCerrar, alLeer, actividad }: Props) {
  const agente = AGENTES[indice];
  const t = textosDe(agente.id);
  const anterior = indice > 0 ? textosDe(AGENTES[indice - 1].id).nombre : null;

  return (
    <aside
      aria-label={`Agente ${agente.numero}: ${t.nombre}`}
      style={{
        position: "absolute",
        left: "50%",
        bottom: 112,
        transform: "translateX(-50%)",
        width: "min(620px, 92vw)",
        padding: "22px 26px",
        fontSize: 15.5,
        lineHeight: 1.55,
        zIndex: 6,
      }}
      className="panel aparece"
    >
      <button onClick={alCerrar} aria-label="Cerrar" className="btn btn-suave" style={{ position: "absolute", right: 14, top: 14, width: 32, height: 32, padding: 0, borderRadius: 10, fontSize: 16, lineHeight: 1 }}>
        ✕
      </button>
      <div style={{ fontSize: 12, color: "var(--texto-suave)", letterSpacing: "0.12em" }}>AGENTE {agente.numero} · {agente.comando}</div>
      <h2 style={{ margin: "4px 0 10px", fontSize: 24, fontWeight: 750, letterSpacing: "-0.01em", color: "#fff" }}>
        {t.nombre} <span style={{ fontWeight: 400, fontSize: 16, color: "#aab0d8" }}>· {t.subtitulo}</span>
      </h2>
      <p style={{ margin: "0 0 6px" }}>{t.queHace}</p>
      <p style={{ margin: "0 0 16px", color: "#c4c8e8" }}>
        <strong style={{ color: "#fff" }}>Para qué sirve:</strong> {t.paraQueSirve}
      </p>

      {estado === "habilitado" && (
        <button onClick={alOrdenar} className={claseBoton}>
          Ordenar que corra {agente.comando}
        </button>
      )}
      {estado === "corriendo" && (
        <div>
          <p style={{ margin: "0 0 8px", color: "var(--aviso)", fontWeight: 650 }}>Trabajando… esto es lo que está haciendo:</p>
          <Hace lineas={actividad} cuenta={t.globito} />
        </div>
      )}
      {estado === "terminado" && (
        <>
          <p style={{ margin: "0 0 12px", color: "var(--ok)", fontWeight: 650 }}>Ya terminó. {t.listo}</p>
          {actividad && actividad.length > 0 && <Hace lineas={actividad} titulo="Lo que hizo" cuenta={t.globito} />}
          {alLeer && (
            <button onClick={alLeer} className={claseBoton}>
              Leer lo que produjo
            </button>
          )}
        </>
      )}
      {estado === "deshabilitado" && (
        <p style={{ margin: 0, color: "var(--error)" }}>
          {!briefDejado ? "Todavía no: primero dejá el brief en la papelería." : `Todavía no: primero tiene que terminar el agente anterior (${anterior}).`}
        </p>
      )}
    </aside>
  );
}
