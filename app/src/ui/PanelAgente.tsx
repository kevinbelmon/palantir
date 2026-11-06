import { textosDe } from "../contenido";
import { AGENTES, type EstadoAgente } from "../flujo";

type Props = {
  indice: number;
  estado: EstadoAgente;
  briefDejado: boolean;
  alOrdenar: () => void;
  alCerrar: () => void;
  /** Abre el documento que dejó el agente (solo si ya terminó). */
  alLeer?: () => void;
};

const estiloBoton = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: "#ffd54a",
  color: "#1e2033",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
} as const;

/** Lo que se ve al tocar un agente: qué hace, para qué sirve, y qué se le puede ordenar ahora. */
export function PanelAgente({ indice, estado, briefDejado, alOrdenar, alCerrar, alLeer }: Props) {
  const agente = AGENTES[indice];
  const t = textosDe(agente.id);
  const anterior = indice > 0 ? textosDe(AGENTES[indice - 1].id).nombre : null;

  return (
    <aside
      aria-label={`Agente ${agente.numero}: ${t.nombre}`}
      style={{
        position: "absolute",
        left: "50%",
        bottom: 70,
        transform: "translateX(-50%)",
        width: "min(620px, 92vw)",
        padding: "18px 22px",
        borderRadius: 16,
        background: "rgba(30, 32, 51, 0.96)",
        border: "2px solid #8e92c4",
        color: "#e6e8f5",
        fontSize: 16,
        lineHeight: 1.45,
        boxShadow: "0 10px 36px rgba(0,0,0,0.45)",
      }}
    >
      <button onClick={alCerrar} aria-label="Cerrar" style={{ position: "absolute", right: 12, top: 8, background: "none", border: "none", color: "#aab0d8", fontSize: 22, cursor: "pointer" }}>
        ✕
      </button>
      <div style={{ fontSize: 13, color: "#aab0d8", letterSpacing: 0.6 }}>AGENTE {agente.numero} · {agente.comando}</div>
      <h2 style={{ margin: "2px 0 8px", fontSize: 24, color: "#fff" }}>
        {t.nombre} <span style={{ fontWeight: 400, fontSize: 16, color: "#aab0d8" }}>· {t.subtitulo}</span>
      </h2>
      <p style={{ margin: "0 0 6px" }}>{t.queHace}</p>
      <p style={{ margin: "0 0 14px", color: "#c4c8e8" }}>
        <strong style={{ color: "#fff" }}>Para qué sirve:</strong> {t.paraQueSirve}
      </p>

      {estado === "habilitado" && (
        <button onClick={alOrdenar} style={estiloBoton}>
          ▶ Ordenar que corra {agente.comando}
        </button>
      )}
      {estado === "corriendo" && <p style={{ margin: 0, color: "#ffd54a", fontWeight: 700 }}>⏳ Trabajando… mirá el globito en su sala.</p>}
      {estado === "terminado" && (
        <>
          <p style={{ margin: "0 0 10px", color: "#6ee79a", fontWeight: 700 }}>✔ Ya terminó. {t.listo}</p>
          {alLeer && (
            <button onClick={alLeer} style={estiloBoton}>
              📄 Leer lo que produjo
            </button>
          )}
        </>
      )}
      {estado === "deshabilitado" && (
        <p style={{ margin: 0, color: "#f0a0a0" }}>
          {!briefDejado ? "Todavía no: primero dejá el brief en la papelería." : `Todavía no: primero tiene que terminar el agente anterior (${anterior}).`}
        </p>
      )}
    </aside>
  );
}
