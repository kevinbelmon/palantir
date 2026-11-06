import { useEffect, useState } from "react";
import { etiquetaDeEstado, textosDe } from "../contenido";
import { AGENTES, resumenDock, type Estado } from "../flujo";
import { APARIENCIAS, COLORES_ESTADO } from "../oficina";

/** Alto que ocupa el dock: el mapa deja ese margen abajo para no quedar tapado. */
export const ALTO_DOCK = 96;

function Cara({ indice }: { indice: number }) {
  const a = APARIENCIAS[indice % APARIENCIAS.length];
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill={a.camisa} />
      <circle cx="22" cy="21" r="11" fill="#f6d24a" />
      <path d="M10.5 19.5a11.5 11.5 0 0 1 23 0c-4-4-8-5-11.500-5s-7.500 1-11.500 5z" fill={a.pelo} />
      <rect x="18" y="21" width="2.600" height="3.600" rx="1" fill="#1d2133" />
      <rect x="23.400" y="21" width="2.600" height="3.600" rx="1" fill="#1d2133" />
    </svg>
  );
}

type Props = { estado: Estado; alElegir: (indice: number) => void; alNuevo: () => void };

/** El dock de abajo: los 8 agentes con su estado, cuántas tareas faltan y a quién le toca. */
export function Dock({ estado, alElegir, alNuevo }: Props) {
  const { tareas, teToca } = resumenDock(estado);
  const [seguro, setSeguro] = useState(false);

  // el «¿Seguro?» se arrepiente solo a los 3 segundos
  useEffect(() => {
    if (!seguro) return;
    const t = setTimeout(() => setSeguro(false), 3000);
    return () => clearTimeout(t);
  }, [seguro]);

  const nuevo = () => {
    if (!estado.briefDejado) return alNuevo();
    if (!seguro) return setSeguro(true);
    setSeguro(false);
    alNuevo();
  };

  return (
    <nav
      aria-label="Los agentes"
      style={{
        position: "absolute",
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        borderRadius: 24,
        background: "rgba(20, 22, 40, 0.94)",
        border: "1px solid #3a3f66",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        color: "#e6e8f5",
        zIndex: 5,
      }}
    >
      <button
        onClick={nuevo}
        aria-label="Empezar de nuevo"
        style={{ display: "grid", justifyItems: "center", gap: 2, background: "none", border: "none", color: "#e6e8f5", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
      >
        <span style={{ width: 44, height: 44, borderRadius: 14, background: seguro ? "#ff6b81" : "#3b6cff", display: "grid", placeItems: "center", fontSize: 24, color: "#fff" }}>{seguro ? "?" : "+"}</span>
        {seguro ? "¿Seguro?" : "Nuevo"}
      </button>
      <span style={{ width: 1, height: 44, background: "#3a3f66" }} />

      {AGENTES.map((a, i) => {
        const e = estado.agentes[i];
        const info = etiquetaDeEstado(e);
        const nombre = textosDe(a.id).nombre;
        return (
          <button
            key={a.id}
            onClick={() => alElegir(i)}
            aria-label={`${nombre}: ${info.texto}`}
            title={`${a.comando} · ${info.texto}`}
            style={{ position: "relative", display: "grid", justifyItems: "center", gap: 2, background: "none", border: "none", color: "#e6e8f5", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, opacity: e === "deshabilitado" ? 0.7 : 1 }}
          >
            <span style={{ position: "relative", display: "block", width: 44, height: 44 }}>
              <Cara indice={i} />
              <span style={{ position: "absolute", right: -2, top: -2, width: 14, height: 14, borderRadius: 7, background: COLORES_ESTADO[info.color], border: "2px solid #14162a" }} />
              {e === "habilitado" && (
                <span data-insignia="1" style={{ position: "absolute", left: -6, top: -6, minWidth: 18, height: 18, borderRadius: 9, background: "#ff4d6d", color: "#fff", fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center", border: "2px solid #14162a" }}>
                  1
                </span>
              )}
            </span>
            {nombre}
          </button>
        );
      })}

      <span style={{ width: 1, height: 44, background: "#3a3f66" }} />
      <div style={{ display: "grid", justifyItems: "center", gap: 2, minWidth: 54, fontSize: 12, fontWeight: 600 }}>
        <span data-contador="tareas" style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>{tareas}</span>
        Tareas
      </div>
      <div style={{ display: "grid", justifyItems: "center", gap: 2, minWidth: 54, fontSize: 12, fontWeight: 600 }}>
        <span data-contador="teToca" style={{ width: 44, height: 44, borderRadius: 14, background: teToca > 0 ? "#ff4d6d" : "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>{teToca}</span>
        Te toca
      </div>
    </nav>
  );
}
