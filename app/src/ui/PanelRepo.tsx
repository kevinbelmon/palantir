import { useState } from "react";
import type { Cliente, EstadoLocal } from "../conexion";

type Props = { estado: EstadoLocal; cliente: Cliente; alCambiar: (e: EstadoLocal) => void; alCerrar: () => void };

function Paso({ hecho, texto }: { hecho: boolean; texto: string }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 10, color: hecho ? "var(--texto)" : "var(--texto-suave)" }}>
      <span aria-hidden="true" style={{ flex: "none", width: 20, height: 20, borderRadius: 10, display: "grid", placeItems: "center", background: hecho ? "var(--ok)" : "rgba(255,255,255,0.08)" }}>
        {hecho && (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#06210f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.500l4.500 4.500L19 7.500" />
          </svg>
        )}
      </span>
      {texto}
    </li>
  );
}

const etiqueta = { display: "block", fontSize: 12, fontWeight: 650, letterSpacing: "0.04em", color: "var(--texto-suave)", margin: "0 0 6px" } as const;

/** «Tu repositorio»: pegás el link de un repo de GitHub, escribís tu brief y los agentes corren de verdad ahí. */
export function PanelRepo({ estado, cliente, alCambiar, alCerrar }: Props) {
  const [url, setUrl] = useState("");
  const [brief, setBrief] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState("");

  const hacer = async (que: string, tarea: () => Promise<EstadoLocal>) => {
    setOcupado(que);
    setError("");
    try {
      alCambiar(await tarea());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Tu repositorio" style={{ position: "absolute", inset: 0, zIndex: 8, display: "grid", placeItems: "center", background: "rgba(8, 9, 20, 0.55)", WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)", padding: 16 }}>
      <section className="panel aparece" style={{ width: "min(580px, 94vw)", maxHeight: "90vh", overflow: "auto", padding: "28px 30px", background: "rgba(22, 24, 44, 0.92)" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 750, letterSpacing: "-0.01em" }}>Tu repositorio</h2>
        <p style={{ margin: "0 0 22px", color: "var(--texto-suave)", fontSize: 14, lineHeight: 1.55 }}>
          Pegá el link de un repositorio tuyo de GitHub. Se instala el modelo, subís tu brief y los agentes corren de verdad con tu Claude. Todo queda publicado ahí.
        </p>

        <label style={etiqueta} htmlFor="repo-url">
          Link del repositorio
        </label>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input id="repo-url" className="campo" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/tu-usuario/tu-repo" />
          <button className="btn" style={{ flex: "none" }} disabled={ocupado !== null || !url.trim()} onClick={() => hacer("repo", () => cliente.conectarRepo(url))}>
            {ocupado === "repo" ? "Conectando…" : "Conectar"}
          </button>
        </div>

        {estado.modeloInstalado && (
          <>
            <label style={etiqueta} htmlFor="repo-brief">
              Tu brief: qué querés construir
            </label>
            <textarea id="repo-brief" className="campo" rows={5} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Ejemplo: una app para llevar la lista de compras de la casa, donde cada uno agrega lo que falta." style={{ resize: "vertical", marginBottom: 12 }} />
            <button className="btn" disabled={ocupado !== null || brief.trim().length < 10} onClick={() => hacer("brief", () => cliente.subirBrief(brief))}>
              {ocupado === "brief" ? "Subiendo…" : estado.briefSubido ? "Subir de nuevo" : "Guardar y subir"}
            </button>
          </>
        )}

        {error && (
          <p role="alert" style={{ margin: "16px 0 0", padding: "10px 14px", borderRadius: 12, background: "rgba(255, 143, 163, 0.12)", color: "var(--error)", fontSize: 14 }}>
            {error}
          </p>
        )}

        <ul style={{ listStyle: "none", margin: "22px 0", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, fontSize: 14, borderRadius: 14, background: "rgba(255,255,255,0.04)" }}>
          <Paso hecho={estado.repo !== null} texto={estado.repo ? `Repo conectado: ${estado.repo}` : "Repo conectado"} />
          <Paso hecho={estado.modeloInstalado} texto="Modelo SDD instalado y subido" />
          <Paso hecho={estado.briefSubido} texto="Brief guardado en drafts/ y subido" />
        </ul>
        {estado.briefSubido && <p style={{ margin: "0 0 18px", color: "var(--aviso)", fontSize: 14, lineHeight: 1.5 }}>Listo: ahora cada agente que ordenes correr trabaja de verdad en tu repo. Puede tardar unos minutos y usa tu cuenta de Claude.</p>}

        <button className="btn btn-suave" onClick={alCerrar}>
          Cerrar
        </button>
      </section>
    </div>
  );
}

/** El botón de arriba, junto al de música, que abre «Tu repositorio». */
export function BotonRepo({ conectado, alAbrir }: { conectado: boolean; alAbrir: () => void }) {
  return (
    <button onClick={alAbrir} className="pastilla" style={{ position: "absolute", top: 12, right: 176, zIndex: 6 }}>
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: conectado ? "var(--ok)" : "#6f76a3", boxShadow: conectado ? "0 0 10px var(--ok)" : "none" }} />
      {conectado ? "Repo conectado" : "Conectar repo"}
    </button>
  );
}
