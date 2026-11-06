import { textosDe } from "../contenido";
import { AGENTES } from "../flujo";
import { estiloColumna } from "./columna";

type Props = {
  indice: number;
  alCerrar: () => void;
  /** Lo que produjo el agente de verdad en el repo de la persona; si falta, se muestra el ejemplo simplificado. */
  real?: string;
};

/** El documento que dejó un agente, en la columna de la derecha (no tapa la oficina). */
export function VisorDocumento({ indice, alCerrar, real }: Props) {
  const agente = AGENTES[indice];
  const t = textosDe(agente.id);
  const d = t.documento;

  return (
    <aside role="dialog" aria-label={`Documento de ${t.nombre}`} className="panel aparece" style={{ ...estiloColumna, padding: "20px 20px 16px", fontSize: 15, lineHeight: 1.55 }}>
      <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--texto-suave)", paddingRight: 42 }}>
        DOCUMENTO DE {t.nombre.toUpperCase()} · {agente.comando}
      </div>
      <h2 style={{ margin: "4px 36px 12px 0", fontSize: 20, fontWeight: 750, letterSpacing: "-0.01em", color: "var(--texto)" }}>{real === undefined ? d.titulo : "Lo que produjo, de verdad"}</h2>
      <button onClick={alCerrar} aria-label="Cerrar el documento" className="btn btn-suave" style={{ position: "absolute", right: 14, top: 14, width: 32, height: 32, padding: 0, borderRadius: 0, fontSize: 16, lineHeight: 1 }}>
        ✕
      </button>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
        {real !== undefined && <pre style={{ margin: "0 0 14px", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit", fontSize: 14.5 }}>{real || "El agente terminó sin dejar un mensaje."}</pre>}
        {real === undefined &&
          d.bloques.map((b) => (
            <section key={b.encabezado} style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 0, background: "var(--superficie)" }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "var(--acento)" }}>{b.encabezado}</h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: "var(--texto)" }}>
                {b.lineas.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </section>
          ))}
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--texto-suave)" }}>
          {real === undefined ? "Es una versión simplificada, hecha con el ejemplo de los gastos entre amigos." : "Lo escribió Claude en tu repositorio y ya está subido a GitHub."}
        </p>
      </div>

      <button onClick={alCerrar} className="btn" style={{ marginTop: 12 }}>
        Cerrar
      </button>
    </aside>
  );
}
