import { IconoLupa, IconoMouse } from "./iconos";

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
        flexDirection: "column",
        gap: 6,
        padding: "10px 16px",
        borderRadius: 12,
        background: "rgba(30, 32, 51, 0.82)",
        color: "#e6e8f5",
        fontSize: 14,
        maxWidth: 340,
        pointerEvents: "none",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IconoMouse /> Mantené el clic derecho y arrastrá para mover la oficina
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IconoLupa /> Usá la rueda para acercar o alejar
      </span>
    </aside>
  );
}
