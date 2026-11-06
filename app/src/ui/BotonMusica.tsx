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
        padding: "9px 16px",
        borderRadius: 12,
        border: "2px solid #8e92c4",
        background: "rgba(30, 32, 51, 0.88)",
        color: "#ffffff",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {silenciada ? "🔇 Música apagada" : "🔊 Música"}
    </button>
  );
}
