import { textosDe } from "../contenido";
import { AGENTES } from "../flujo";
import { CARTEL_CENTRAL } from "../oficina";

/** El cierre del recorrido: repasa los 8 pasos y deja volver a jugar. */
export function PantallaFinal({ alReiniciar }: { alReiniciar: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Terminaste el recorrido"
      style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(15, 16, 30, 0.8)", padding: 16 }}
    >
      <article
        style={{
          width: "min(720px, 94vw)",
          maxHeight: "92vh",
          overflow: "auto",
          padding: "28px 34px",
          borderRadius: 18,
          background: "#1e2033",
          color: "#e6e8f5",
          border: "2px solid #ffd54a",
          boxShadow: "0 20px 70px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ fontSize: 44, textAlign: "center" }}>🎉</div>
        <h2 style={{ margin: "4px 0 6px", textAlign: "center", fontSize: 30, color: "#fff" }}>¡Terminaste el recorrido!</h2>
        <p style={{ margin: "0 0 18px", textAlign: "center", color: "#c4c8e8", fontSize: 17 }}>
          Así viajó el brief por las 8 salas, de una idea suelta a un trabajo revisado:
        </p>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {AGENTES.map((a) => {
            const t = textosDe(a.id);
            return (
              <li key={a.id} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                <span style={{ minWidth: 26, height: 26, borderRadius: 13, background: "#ffd54a", color: "#1e2033", fontWeight: 800, display: "grid", placeItems: "center" }}>{a.numero}</span>
                <span>
                  <strong style={{ color: "#fff" }}>{t.nombre}</strong> <span style={{ color: "#aab0d8" }}>· {t.subtitulo}</span>
                  <span style={{ display: "block", fontSize: 14, color: "#c4c8e8" }}>Dejó: {t.documento.titulo}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p style={{ margin: "20px 0 16px", textAlign: "center", fontSize: 19, fontWeight: 700, color: "#ffd54a" }}>
          {CARTEL_CENTRAL.titulo}: {CARTEL_CENTRAL.lema}
        </p>
        <div style={{ textAlign: "center" }}>
          <button
            onClick={alReiniciar}
            style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "#ffd54a", color: "#1e2033", fontSize: 18, fontWeight: 800, cursor: "pointer" }}
          >
            🔄 Jugar de nuevo
          </button>
        </div>
      </article>
    </div>
  );
}
