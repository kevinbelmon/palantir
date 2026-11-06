import { textosDe } from "../contenido";
import { AGENTES } from "../flujo";

type Props = { indice: number; alCerrar: () => void };

/** El documento que dejó un agente, abierto para leer. */
export function VisorDocumento({ indice, alCerrar }: Props) {
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
        <h2 style={{ margin: "4px 0 16px", fontSize: 26, color: "#1e2033" }}>{d.titulo}</h2>
        {d.bloques.map((b) => (
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
          Es una versión simplificada, hecha con el ejemplo de los gastos entre amigos.
        </p>
        <button
          onClick={alCerrar}
          style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#3b3466", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
        >
          Cerrar
        </button>
      </article>
    </div>
  );
}
