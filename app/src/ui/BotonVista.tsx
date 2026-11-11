import type { ModoDeVista } from "../escena";

type Props = { modo: ModoDeVista; alCambiar: () => void };

/** Alterna entre mirar la oficina desde arriba y caminar por adentro, habitación por habitación. */
export function BotonVista({ modo, alCambiar }: Props) {
  const caminando = modo === "persona";
  return (
    <button onClick={alCambiar} className="pastilla" aria-pressed={caminando} aria-label={caminando ? "Ver la oficina desde arriba" : "Caminar por la oficina en primera persona"} style={{ position: "absolute", top: 12, right: 600, zIndex: 6 }}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {caminando ? <path d="M3 11l9-7 9 7M5 10v10h14V10" /> : <path d="M12 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM8 21v-6l-2-3 3-2h6l3 2-2 3v6M10 21v-4M14 21v-4" />}
      </svg>
      {caminando ? "Ver desde arriba" : "Caminar por adentro"}
    </button>
  );
}
