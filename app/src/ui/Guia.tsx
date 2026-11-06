/** La frase de arriba: qué tiene que hacer la persona ahora. */
export function Guia({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "min(720px, calc(100vw - 760px))",
        padding: "12px 20px",
        borderRadius: 14,
        background: "rgba(30, 32, 51, 0.9)",
        border: "2px solid #ffd54a",
        color: "#ffffff",
        fontSize: 17,
        lineHeight: 1.4,
        textAlign: "center",
        boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
      }}
    >
      {mensaje}
    </div>
  );
}
