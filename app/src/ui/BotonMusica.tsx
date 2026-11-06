import { IconoSonido } from "./iconos";

type Props = { silenciada: boolean; alAlternar: () => void };

/** Silencia o activa la música de fondo. */
export function BotonMusica({ silenciada, alAlternar }: Props) {
  return (
    <button
      onClick={alAlternar}
      aria-pressed={silenciada}
      aria-label={silenciada ? "Activar la música" : "Silenciar la música"}
      style={{
        position: "absolute",
        top: 12,
        zIndex: 6,
        right: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 999,
        border: "1px solid #3a3f66",
        background: "rgba(30, 32, 51, 0.9)",
        color: "#ffffff",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <IconoSonido apagado={silenciada} />
      {silenciada ? "Música apagada" : "Música"}
    </button>
  );
}
