import { useState } from "react";
import { IconoSonido } from "./iconos";

export type OpcionDeCancion = { id: string; nombre: string; descripcion: string };

type Props = {
  silenciada: boolean;
  alAlternar: () => void;
  /** Las canciones para elegir (si falta, solo se muestra el botón de silenciar). */
  canciones?: readonly OpcionDeCancion[];
  actual?: string;
  alElegir?: (id: string) => void;
};

/** Silencia o activa la música de fondo y, si hay varias canciones, deja elegir cuál suena. */
export function BotonMusica({ silenciada, alAlternar, canciones, actual, alElegir }: Props) {
  const [abierto, setAbierto] = useState(false);
  const hayLista = canciones !== undefined && canciones.length > 1 && alElegir !== undefined;
  const nombreActual = canciones?.find((c) => c.id === actual)?.nombre;

  return (
    <div style={{ position: "absolute", top: 12, right: 16, zIndex: 6, display: "flex", gap: 8 }}>
      <button onClick={alAlternar} aria-pressed={silenciada} aria-label={silenciada ? "Activar la música" : "Silenciar la música"} className="pastilla">
        <IconoSonido apagado={silenciada} />
        {silenciada ? "Música apagada" : "Música"}
      </button>
      {hayLista && (
        <>
          <button onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-haspopup="menu" aria-label="Elegir la canción" className="pastilla" title={nombreActual}>
            Canciones
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: abierto ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {abierto && (
            <div role="menu" aria-label="Canciones" className="panel aparece" style={{ position: "absolute", top: 48, right: 0, width: 320, padding: 8 }}>
              {canciones.map((c) => {
                const sonando = c.id === actual;
                return (
                  <button key={c.id} role="menuitemradio" aria-checked={sonando} onClick={() => (alElegir(c.id), setAbierto(false))} className="paso" style={{ alignItems: "flex-start", padding: "10px 12px" }}>
                    <span aria-hidden="true" style={{ flex: "none", marginTop: 4, width: 14, height: 14, borderRadius: 0, border: `2px solid ${sonando ? "var(--acento)" : "var(--texto-suave)"}`, background: sonando ? "var(--acento)" : "transparent", boxShadow: sonando ? "inset 0 0 0 2px #000" : "none" }} />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 650 }}>{c.nombre}</span>
                      <span style={{ display: "block", fontSize: 12.5, color: "var(--texto-suave)", marginTop: 2, lineHeight: 1.4 }}>{c.descripcion}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
