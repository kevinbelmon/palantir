/** La frase de arriba: qué tiene que hacer la persona ahora. */
export function Guia({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "absolute",
        bottom: 100,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "min(720px, calc(100vw - 760px))",
        padding: "12px 22px",
        borderRadius: 0,
        fontSize: 16,
        lineHeight: 1.45,
        textAlign: "center",
        boxShadow: "0 0 0 1px rgba(255,213,74,0.55)",
      }}
      className="panel aparece"
    >
      {mensaje}
    </div>
  );
}
