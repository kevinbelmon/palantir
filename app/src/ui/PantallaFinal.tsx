import { textosDe } from "../contenido";
import { AGENTES } from "../flujo";
import { CARTEL_CENTRAL } from "../oficina";
import { estiloColumna } from "./columna";

/** El cierre del recorrido, en la columna de la derecha: repasa los 8 pasos y deja volver a jugar. */
export function PantallaFinal({ alReiniciar }: { alReiniciar: () => void }) {
  return (
    <aside role="dialog" aria-label="Terminaste el recorrido" className="panel aparece" style={{ ...estiloColumna, padding: "22px 20px 18px" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 750, letterSpacing: "-0.02em", color: "#fff" }}>¡Terminaste el recorrido!</h2>
      <p style={{ margin: "0 0 14px", color: "#c4c8e8", fontSize: 14.5 }}>Así viajó el brief por las 8 salas, de una idea suelta a un trabajo revisado:</p>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6, flex: 1, minHeight: 0, overflowY: "auto" }}>
        {AGENTES.map((a) => {
          const t = textosDe(a.id);
          return (
            <li key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 12px", borderRadius: 14, background: "rgba(255,255,255,0.05)" }}>
              <span style={{ flex: "none", width: 26, height: 26, borderRadius: 9, background: "rgba(124,147,255,0.2)", color: "var(--acento)", fontWeight: 800, fontSize: 13, display: "grid", placeItems: "center" }}>{a.numero}</span>
              <span style={{ fontSize: 14 }}>
                <strong style={{ color: "#fff" }}>{t.nombre}</strong> <span style={{ color: "#aab0d8" }}>· {t.subtitulo}</span>
                <span style={{ display: "block", fontSize: 13, color: "#c4c8e8" }}>Dejó: {t.documento.titulo}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p style={{ margin: "14px 0 12px", fontSize: 15, fontWeight: 650, color: "var(--aviso)" }}>
        {CARTEL_CENTRAL.titulo}: {CARTEL_CENTRAL.lema}
      </p>
      <button onClick={alReiniciar} className="btn">
        Jugar de nuevo
      </button>
    </aside>
  );
}
