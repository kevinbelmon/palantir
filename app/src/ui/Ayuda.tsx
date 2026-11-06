/** Cómo moverse por la oficina, siempre a la vista. */
export function Ayuda() {
  return (
    <aside
      aria-label="Cómo moverse"
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        display: "flex",
        gap: 18,
        padding: "10px 16px",
        borderRadius: 12,
        background: "rgba(30, 32, 51, 0.82)",
        color: "#e6e8f5",
        fontSize: 14,
        pointerEvents: "none",
      }}
    >
      <span>🖱️ Mantené el clic derecho y arrastrá para mover la oficina</span>
      <span>🔍 Usá la rueda para acercar o alejar</span>
    </aside>
  );
}
