import { useState } from "react";
import { NOMBRE_BOT, tarjetasBot, type ContextoBot } from "../contenido";
import { AGENTES } from "../flujo";
import { ANCHO_PASOS } from "./PasoAPaso";

const CLAVE_MINIMIZADO = "sdd-bot-minimizado";

const leerMinimizado = (): boolean => {
  try {
    return localStorage.getItem(CLAVE_MINIMIZADO) === "1";
  } catch {
    return false;
  }
};

/** La cara del bot: cuadrada y plana, como el resto de la interfaz. */
function CaraDelBot({ tam = 44 }: { tam?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={tam} height={tam} aria-hidden="true" style={{ flex: "none" }}>
      <rect x="23" y="2" width="2" height="8" fill="#f2f2f2" />
      <rect x="20" y="0" width="8" height="4" fill="#ffd54a" className="latido" />
      <rect x="6" y="10" width="36" height="30" fill="#f2f2f2" />
      <rect x="2" y="20" width="4" height="10" fill="#9b9b9b" />
      <rect x="42" y="20" width="4" height="10" fill="#9b9b9b" />
      <rect x="12" y="19" width="8" height="8" fill="#000" />
      <rect x="28" y="19" width="8" height="8" fill="#000" />
      <rect x="14" y="21" width="3" height="3" fill="#5b7cff" />
      <rect x="30" y="21" width="3" height="3" fill="#5b7cff" />
      <rect x="15" y="32" width="18" height="3" fill="#000" />
    </svg>
  );
}

const quien = (contexto: ContextoBot): string => {
  if (contexto.tipo === "intro") return "Para empezar";
  if (contexto.tipo === "fin") return "Terminaste";
  const a = AGENTES[contexto.indice];
  return a ? `Paso ${a.numero} de ${AGENTES.length} · ${a.comando}` : "";
};

type Props = { contexto: ContextoBot };

/**
 * El bot guía, en la esquina de arriba a la izquierda del mapa: explica de a una tarjeta qué es el paso, qué hace el agente,
 * qué tiene que hacer la persona, cómo sabe que terminó y qué hacer si se traba. Se puede achicar.
 */
export function Bot({ contexto }: Props) {
  const [minimizado, setMinimizado] = useState(leerMinimizado);
  const [pagina, setPagina] = useState(0);
  // si cambia el tema, se arranca de la primera tarjeta (se compara en el render, sin efectos)
  const clave = contexto.tipo === "agente" ? `a${contexto.indice}` : contexto.tipo;
  const [claveVista, setClaveVista] = useState(clave);
  if (clave !== claveVista) {
    setClaveVista(clave);
    setPagina(0);
  }

  const cambiarMinimizado = (valor: boolean) => {
    setMinimizado(valor);
    try {
      localStorage.setItem(CLAVE_MINIMIZADO, valor ? "1" : "0");
    } catch {
      /* sin almacenamiento: vale hasta cerrar la página */
    }
  };

  const posicion = { position: "absolute", top: 76, left: ANCHO_PASOS + 12, zIndex: 6 } as const;

  if (minimizado) {
    return (
      <button onClick={() => cambiarMinimizado(false)} className="panel" aria-label={`Abrir la ayuda de ${NOMBRE_BOT}`} style={{ ...posicion, display: "flex", alignItems: "center", gap: 10, padding: "8px 14px 8px 10px", cursor: "pointer", color: "var(--texto)", font: "inherit", fontSize: 14, fontWeight: 650 }}>
        <CaraDelBot tam={30} />
        ¿Te explico? Tocá acá
      </button>
    );
  }

  const tarjetas = tarjetasBot(contexto);
  const ultima = pagina >= tarjetas.length - 1;
  const t = tarjetas[Math.min(pagina, tarjetas.length - 1)];

  return (
    <aside role="complementary" aria-label={`${NOMBRE_BOT}, el bot guía`} className="panel aparece" style={{ ...posicion, width: 340, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CaraDelBot />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 750 }}>{NOMBRE_BOT} · tu guía</div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)", marginTop: 2 }}>{quien(contexto)}</div>
        </div>
        <button onClick={() => cambiarMinimizado(true)} aria-label={`Achicar a ${NOMBRE_BOT}`} className="btn btn-suave" style={{ width: 32, height: 32, padding: 0, borderRadius: 0, fontSize: 16, lineHeight: 1 }}>
          –
        </button>
      </div>

      <div style={{ borderLeft: "3px solid var(--aviso)", padding: "2px 0 2px 12px" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>{t.titulo}</h2>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>{t.texto}</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="btn btn-suave" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)} style={{ padding: "6px 12px" }}>
          Atrás
        </button>
        <span aria-label={`Tarjeta ${pagina + 1} de ${tarjetas.length}`} style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--texto-suave)" }}>
          {pagina + 1} de {tarjetas.length}
        </span>
        <button className="btn" onClick={() => setPagina(ultima ? 0 : pagina + 1)} style={{ padding: "6px 12px" }}>
          {ultima ? "Ver de nuevo" : "Siguiente"}
        </button>
      </div>
    </aside>
  );
}
