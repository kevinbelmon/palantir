import { IconoSonido } from "./iconos";

type Props = { silenciada: boolean; alAlternar: () => void };

/** Silencia o activa la música de fondo. */
export function BotonMusica({ silenciada, alAlternar }: Props) {
  return (
    <button
      onClick={alAlternar}
      aria-pressed={silenciada}
      aria-label={silenciada ? "Activar la música" : "Silenciar la música"}
      className="pastilla"
      style={{ position: "absolute", top: 12, right: 16, zIndex: 6 }}
    >
      <IconoSonido apagado={silenciada} />
      {silenciada ? "Música apagada" : "Música"}
    </button>
  );
}
