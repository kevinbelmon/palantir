import { etiquetaDeEstado, textosDe } from "../contenido";
import { AGENTES, type Estado } from "../flujo";
import { APARIENCIAS, COLORES_ESTADO } from "../oficina";

/** Ancho que ocupa el panel: el mapa empieza a su derecha para no quedar tapado. */
export const ANCHO_PASOS = 280;

type Props = { estado: Estado; abierto: number | null; alElegir: (indice: number) => void };

/** El panel de la izquierda: los 8 comandos en orden. Al tocar uno se despliega una frase de para qué sirve. */
export function PasoAPaso({ estado, abierto, alElegir }: Props) {
  return (
    <nav
      aria-label="Paso a paso"
      style={{
        position: "absolute",
        top: 76,
        left: 12,
        bottom: 124,
        width: ANCHO_PASOS - 24,
        display: "flex",
        flexDirection: "column",
        padding: "14px 10px 10px",
        borderRadius: 18,
        background: "rgba(20, 22, 40, 0.94)",
        border: "1px solid #3a3f66",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        color: "#e6e8f5",
        zIndex: 5,
      }}
    >
      <h2 style={{ margin: "0 8px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#aab0d8" }}>Paso a paso</h2>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
        {AGENTES.map((a, i) => {
          const t = textosDe(a.id);
          const e = etiquetaDeEstado(estado.agentes[i] ?? "deshabilitado");
          const abierta = abierto === i;
          return (
            <li key={a.id}>
              <button
                onClick={() => alElegir(i)}
                aria-expanded={abierta}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid " + (abierta ? "#5b8cff" : "transparent"),
                  background: abierta ? "rgba(91, 140, 255, 0.16)" : "transparent",
                  color: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ flex: "none", width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, color: "#1e2033", background: APARIENCIAS[i % APARIENCIAS.length].camisa }}
                >
                  {a.numero}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>{a.comando}</span>
                  <span style={{ display: "block", fontSize: 12, color: "#aab0d8" }}>
                    {t.subtitulo} · {e.texto}
                  </span>
                </span>
                <span aria-hidden="true" style={{ flex: "none", width: 10, height: 10, borderRadius: 5, background: COLORES_ESTADO[e.color] }} />
              </button>
              {abierta && <p style={{ margin: "2px 10px 8px 46px", fontSize: 13, lineHeight: 1.4, color: "#d5d8f0" }}>{t.resumen}</p>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
