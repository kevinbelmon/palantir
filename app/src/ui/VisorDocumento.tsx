import { textosDe } from "../contenido";
import { AGENTES } from "../flujo";

type Props = { indice: number; alCerrar: () => void; /** Lo que produjo el agente de verdad en el repo de la persona; si falta, se muestra el ejemplo simplificado. */ real?: string };

/** El documento que dejó un agente, abierto para leer. */
export function VisorDocumento({ indice, alCerrar, real }: Props) {
  const agente = AGENTES[indice];
  const t = textosDe(agente.id);
  const d = t.documento;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Documento de ${t.nombre}`}
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(15, 16, 30, 0.62)",
        padding: 16,
      }}
    >
      <article
        style={{
          width: "min(680px, 94vw)",
          maxHeight: "86vh",
          overflow: "auto",
          padding: "26px 32px",
          borderRadius: 12,
          background: "#fffdf3",
          color: "#2a2d4a",
          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
          lineHeight: 1.5,
          fontSize: 17,
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: 0.6, color: "#7c80a8" }}>
          DOCUMENTO DE {t.nombre.toUpperCase()} · {agente.comando}
        </div>
        <h2 style={{ margin: "4px 0 16px", fontSize: 26, color: "#1e2033" }}>{real === undefined ? d.titulo : "Lo que produjo, de verdad"}</h2>
        {real !== undefined && <pre style={{ margin: "0 0 14px", whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 16 }}>{real || "El agente terminó sin dejar un mensaje."}</pre>}
        {real === undefined && d.bloques.map((b) => (
          <section key={b.encabezado} style={{ marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, color: "#3b3466" }}>{b.encabezado}</h3>
            <ul style={{ margin: 0, paddingLeft: 22 }}>
              {b.lineas.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        ))}
        <p style={{ margin: "18px 0 14px", fontSize: 14, color: "#7c80a8" }}>
          {real === undefined ? "Es una versión simplificada, hecha con el ejemplo de los gastos entre amigos." : "Lo escribió Claude en tu repositorio y ya está subido a GitHub."}
        </p>
        <button
          onClick={alCerrar}
          className="btn"
        >
          Cerrar
        </button>
      </article>
    </div>
  );
}
