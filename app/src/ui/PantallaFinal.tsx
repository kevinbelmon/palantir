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
      style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(8, 9, 20, 0.7)", WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)", padding: 16 }}
    >
      <article
        className="panel aparece"
        style={{ width: "min(720px, 94vw)", maxHeight: "92vh", overflow: "auto", padding: "32px 36px", background: "rgba(22, 24, 44, 0.94)" }}
      >
        <h2 style={{ margin: "0 0 8px", textAlign: "center", fontSize: 30, fontWeight: 750, letterSpacing: "-0.02em", color: "#fff" }}>¡Terminaste el recorrido!</h2>
        <p style={{ margin: "0 0 18px", textAlign: "center", color: "#c4c8e8", fontSize: 17 }}>
          Así viajó el brief por las 8 salas, de una idea suelta a un trabajo revisado:
        </p>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {AGENTES.map((a) => {
            const t = textosDe(a.id);
            return (
              <li key={a.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.05)" }}>
                <span style={{ flex: "none", width: 28, height: 28, borderRadius: 9, background: "rgba(124,147,255,0.2)", color: "var(--acento)", fontWeight: 800, fontSize: 13, display: "grid", placeItems: "center" }}>{a.numero}</span>
                <span>
                  <strong style={{ color: "#fff" }}>{t.nombre}</strong> <span style={{ color: "#aab0d8" }}>· {t.subtitulo}</span>
                  <span style={{ display: "block", fontSize: 14, color: "#c4c8e8" }}>Dejó: {t.documento.titulo}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p style={{ margin: "20px 0 16px", textAlign: "center", fontSize: 18, fontWeight: 650, color: "var(--aviso)" }}>
          {CARTEL_CENTRAL.titulo}: {CARTEL_CENTRAL.lema}
        </p>
        <div style={{ textAlign: "center" }}>
          <button onClick={alReiniciar} className="btn" style={{ padding: "13px 30px", fontSize: 17 }}>
            Jugar de nuevo
          </button>
        </div>
      </article>
    </div>
  );
}
