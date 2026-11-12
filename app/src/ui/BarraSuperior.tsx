import { textosDe } from "../contenido";
import { AGENTES, progreso, type Estado } from "../flujo";
import { CARTEL_CENTRAL } from "../oficina";
import { Logo } from "./iconos";

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
        padding: "0 440px 0 16px",
        background: "#000000",
        borderBottom: "1px solid var(--linea)",
        color: "var(--texto)",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Logo tam={36} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 750, letterSpacing: "-0.01em", lineHeight: 1.1, whiteSpace: "nowrap" }}>{CARTEL_CENTRAL.titulo}</div>
          <div style={{ fontSize: 12.5, color: "var(--texto-suave)", marginTop: 2, whiteSpace: "nowrap" }}>{CARTEL_CENTRAL.lema}</div>
        </div>
      </div>

      <div className="barra-paso" style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
        <span style={{ fontSize: 14, fontWeight: 650, color: "var(--aviso)", whiteSpace: "nowrap" }}>{textoDelPaso(estado)}</span>
        <div role="progressbar" aria-label="Avance del recorrido" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechos} style={{ display: "flex", gap: 4 }}>
          {AGENTES.map((a, i) => (
            <span
              key={a.id}
              className={i === actual ? "latido" : undefined}
              style={{ width: 24, height: 6, borderRadius: 0, background: i < hechos ? "var(--ok)" : i === actual ? "var(--aviso)" : "var(--superficie-fuerte)" }}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
