import { etiquetaDeEstado, textosDe } from "../contenido";
import { AGENTES, progreso, type Estado } from "../flujo";
import { APARIENCIAS, COLORES_ESTADO } from "../oficina";

/** Ancho que ocupa el panel: el mapa empieza a su derecha para no quedar tapado. */
export const ANCHO_PASOS = 296;

type Props = { estado: Estado; abierto: number | null; alElegir: (indice: number) => void };

/** El panel de la izquierda: los 8 comandos en orden. Al tocar uno se despliega una frase de para qué sirve. */
export function PasoAPaso({ estado, abierto, alElegir }: Props) {
  const { hechos, total, actual } = progreso(estado);
  const avance = hechos === total ? `Completo: ${total} de ${total}` : actual === null ? `${hechos} de ${total}` : `Paso ${actual + 1} de ${total}`;
  return (
    <nav aria-label="Paso a paso" className="panel" style={{ position: "absolute", top: 76, left: 14, bottom: 124, width: ANCHO_PASOS - 28, display: "flex", flexDirection: "column", padding: "18px 10px 10px", zIndex: 5 }}>
      <h2 style={{ margin: "0 12px 8px", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texto-suave)" }}>Paso a paso</h2>
      <div style={{ margin: "0 12px 14px" }}>
        <div role="progressbar" aria-label="Avance del recorrido" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechos} style={{ display: "flex", gap: 3 }}>
          {AGENTES.map((a, i) => (
            <span key={a.id} className={i === actual ? "latido" : undefined} style={{ flex: 1, height: 6, borderRadius: 0, background: i < hechos ? "var(--ok)" : i === actual ? "var(--aviso)" : "var(--superficie-fuerte)" }} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--texto-suave)", marginTop: 6 }}>{avance}</div>
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {AGENTES.map((a, i) => {
          const t = textosDe(a.id);
          const e = etiquetaDeEstado(estado.agentes[i] ?? "deshabilitado");
          const color = APARIENCIAS[i % APARIENCIAS.length].camisa;
          const abierta = abierto === i;
          return (
            <li key={a.id}>
              <button onClick={() => alElegir(i)} aria-expanded={abierta} className="paso">
                <span aria-hidden="true" style={{ flex: "none", width: 30, height: 30, borderRadius: 0, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, color, background: `${color}26` }}>
                  {a.numero}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 650, whiteSpace: "nowrap" }}>{a.comando}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--texto-suave)", marginTop: 1 }}>
                    {t.subtitulo} · {e.texto}
                  </span>
                </span>
                <span aria-hidden="true" style={{ flex: "none", width: 9, height: 9, borderRadius: 0, background: COLORES_ESTADO[e.color], boxShadow: e.color === "gris" ? "none" : `0 0 10px ${COLORES_ESTADO[e.color]}` }} />
              </button>
              {abierta && (
                <p className="aparece" style={{ margin: "4px 10px 10px 52px", fontSize: 13, lineHeight: 1.5, color: "var(--texto)" }}>
                  {t.resumen}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
