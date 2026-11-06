/** Íconos dibujados en código (nada de emojis ni imágenes). Heredan el color del texto. */
const base = { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/** El logo: cuatro bloques que se encastran. */
export function Logo({ tam = 36 }: { tam?: number }) {
  return (
    <svg viewBox="0 0 36 36" width={tam} height={tam} aria-hidden="true">
      <rect x="2" y="2" width="15" height="15" rx="0" fill="#5b8cff" />
      <rect x="19" y="2" width="15" height="15" rx="0" fill="#8e6bff" />
      <rect x="2" y="19" width="15" height="15" rx="0" fill="#3ecf6e" />
      <rect x="19" y="19" width="15" height="15" rx="0" fill="#ffd54a" />
    </svg>
  );
}

export function IconoSonido({ apagado }: { apagado: boolean }) {
  return (
    <svg {...base}>
      <path d="M4 9.5v5h3.5L12 18.500v-13L7.500 9.500H4z" fill="currentColor" stroke="none" />
      {apagado ? <path d="M16 9.500l5 5M21 9.500l-5 5" /> : <path d="M15.500 9a4 4 0 0 1 0 6M18 6.500a8 8 0 0 1 0 11" />}
    </svg>
  );
}
