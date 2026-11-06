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
        borderRadius: 18,
        fontSize: 16,
        lineHeight: 1.45,
        textAlign: "center",
        boxShadow: "0 30px 60px -24px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,214,102,0.35)",
      }}
      className="panel aparece"
    >
      {mensaje}
    </div>
  );
}
