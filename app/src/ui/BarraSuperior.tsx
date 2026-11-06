import { textosDe } from "../contenido";
import { AGENTES, progreso, type Estado } from "../flujo";

/** Alto de la barra: el mapa deja ese margen arriba para no quedar tapado. */
export const ALTO_BARRA = 64;

function textoDelPaso(estado: Estado): string {
  const { hechos, total, actual } = progreso(estado);
  if (!estado.briefDejado) return "Dejá el brief en la papelería";
  if (hechos === total) return `Recorrido completo: ${total} de ${total}`;
  if (actual === null) return "";
  return `Paso ${actual + 1} de ${total} · ${textosDe(AGENTES[actual].id).nombre}`;
}

/** Arriba de todo: el nombre del modelo y en qué paso va la persona. */
export function BarraSuperior({ estado }: { estado: Estado }) {
  const { hechos, total, actual } = progreso(estado);
  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: ALTO_BARRA,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 200px 0 16px",
        background: "linear-gradient(90deg, rgba(20,22,40,0.97), rgba(38,34,78,0.94))",
        borderBottom: "1px solid #3a3f66",
        color: "#ffffff",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg,#5b8cff,#8e6bff)", display: "grid", placeItems: "center", fontSize: 22 }} aria-hidden="true">
          🚀
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>Spec-Driven Development</div>
          <div style={{ fontSize: 13, color: "#aab0d8" }}>Planear primero. Construir después.</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#ffd54a", whiteSpace: "nowrap" }}>{textoDelPaso(estado)}</span>
        <div role="progressbar" aria-label="Avance del recorrido" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechos} style={{ display: "flex", gap: 4 }}>
          {AGENTES.map((a, i) => (
            <span
              key={a.id}
              className={i === actual ? "latido" : undefined}
              style={{ width: 22, height: 8, borderRadius: 4, background: i < hechos ? "#3ecf6e" : i === actual ? "#ffd54a" : "rgba(255,255,255,0.18)" }}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
