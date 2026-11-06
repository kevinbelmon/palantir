import { useEffect, useState } from "react";
import type { Cliente, Entrada } from "../conexion";

type Props = { cliente: Cliente; alCerrar: () => void };

const unir = (ruta: string, nombre: string) => (ruta ? `${ruta}/${nombre}` : nombre);
const etiqueta = { display: "block", fontSize: 12, fontWeight: 650, letterSpacing: "0.04em", color: "var(--texto-suave)", margin: "0 0 6px" } as const;

function Icono({ carpeta }: { carpeta: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", color: carpeta ? "var(--aviso)" : "var(--texto-suave)" }}>
      {carpeta ? <path d="M3 7a2 2 0 0 1 2-2h4l2 2.500h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /> : <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v5h5" />}
    </svg>
  );
}

/** Las carpetas y archivos del repo de la persona: se navega, se crean carpetas y se escriben archivos (todo se sube a GitHub). */
export function Archivos({ cliente, alCerrar }: Props) {
  const [ruta, setRuta] = useState("");
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [nombre, setNombre] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vivo = true;
    cliente
      .archivos(ruta)
      .then((r) => vivo && setEntradas(r.entradas))
      .catch((e: unknown) => vivo && setError(e instanceof Error ? e.message : "Algo salió mal."));
    return () => {
      vivo = false;
    };
  }, [cliente, ruta, version]);

  const hacer = async (tarea: () => Promise<void>) => {
    setOcupado(true);
    setError("");
    try {
      await tarea();
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setOcupado(false);
    }
  };

  const abrir = (archivo: string) =>
    hacer(async () => {
      const r = await cliente.leerArchivo(archivo);
      setTexto(r.texto);
      setAbierto(archivo);
    });
  const nuevoArchivo = (archivo: string, contenido = "") => {
    setAbierto(archivo);
    setTexto(contenido);
    setNombre("");
  };
  const partes = ruta.split("/").filter(Boolean);
  const hayReadme = entradas.some((e) => e.nombre.toLowerCase() === "readme.md");

  return (
    <div role="dialog" aria-modal="true" aria-label="Archivos del repo" style={{ position: "absolute", inset: 0, zIndex: 8, display: "grid", placeItems: "center", background: "rgba(8, 9, 20, 0.55)", WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)", padding: 16 }}>
      <section className="panel aparece" style={{ width: "min(680px, 94vw)", maxHeight: "90vh", overflow: "auto", padding: "26px 28px", background: "rgba(22, 24, 44, 0.92)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 750, letterSpacing: "-0.01em" }}>Archivos del repo</h2>
        <p style={{ margin: "0 0 16px", color: "var(--texto-suave)", fontSize: 14 }}>Creá carpetas y escribí archivos, como un README. Todo lo que guardes se sube a GitHub.</p>

        <nav aria-label="Dónde estás" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 12, fontSize: 14 }}>
          <button className="btn btn-suave" style={{ padding: "4px 10px", fontSize: 13 }} onClick={() => (setRuta(""), setAbierto(null))}>
            raíz
          </button>
          {partes.map((p, i) => (
            <span key={unir(partes.slice(0, i).join("/"), p)} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "var(--texto-suave)" }}>/</span>
              <button className="btn btn-suave" style={{ padding: "4px 10px", fontSize: 13 }} onClick={() => (setRuta(partes.slice(0, i + 1).join("/")), setAbierto(null))}>
                {p}
              </button>
            </span>
          ))}
        </nav>

        {abierto === null ? (
          <>
            <ul style={{ listStyle: "none", margin: "0 0 16px", padding: 6, borderRadius: 14, background: "rgba(255,255,255,0.04)", maxHeight: 260, overflow: "auto" }}>
              {entradas.length === 0 && <li style={{ padding: "10px 12px", color: "var(--texto-suave)", fontSize: 14 }}>Esta carpeta está vacía.</li>}
              {entradas.map((e) => (
                <li key={e.nombre}>
                  <button className="paso" style={{ padding: "7px 10px", fontSize: 14 }} onClick={() => (e.tipo === "carpeta" ? setRuta(unir(ruta, e.nombre)) : abrir(unir(ruta, e.nombre)))}>
                    <Icono carpeta={e.tipo === "carpeta"} />
                    {e.nombre}
                  </button>
                </li>
              ))}
            </ul>

            <label style={etiqueta} htmlFor="archivo-nombre">
              Nombre nuevo (en esta carpeta)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <input id="archivo-nombre" className="campo" style={{ flex: "1 1 200px", width: "auto" }} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="por ejemplo: notas.md o documentos" />
              <button className="btn" disabled={ocupado || !nombre.trim()} onClick={() => nuevoArchivo(unir(ruta, nombre.trim()))}>
                Crear archivo
              </button>
              <button className="btn btn-suave" disabled={ocupado || !nombre.trim()} onClick={() => hacer(async () => (await cliente.crearCarpeta(unir(ruta, nombre.trim())), setNombre("")))}>
                Crear carpeta
              </button>
            </div>
            {ruta === "" && !hayReadme && (
              <button className="btn btn-suave" style={{ marginTop: 10 }} onClick={() => nuevoArchivo("README.md", "# Mi proyecto\n\nEscribí acá de qué se trata.\n")}>
                Crear README.md
              </button>
            )}
          </>
        ) : (
          <>
            <label style={etiqueta} htmlFor="archivo-texto">
              {abierto}
            </label>
            <textarea id="archivo-texto" className="campo" rows={12} value={texto} onChange={(e) => setTexto(e.target.value)} style={{ resize: "vertical", marginBottom: 12, fontFamily: "ui-monospace, Consolas, monospace", fontSize: 14 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" disabled={ocupado} onClick={() => hacer(async () => (await cliente.guardarArchivo(abierto, texto), setAbierto(null)))}>
                {ocupado ? "Guardando…" : "Guardar y subir"}
              </button>
              <button className="btn btn-suave" disabled={ocupado} onClick={() => setAbierto(null)}>
                Volver
              </button>
            </div>
          </>
        )}

        {error && (
          <p role="alert" style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 12, background: "rgba(255, 143, 163, 0.12)", color: "var(--error)", fontSize: 14 }}>
            {error}
          </p>
        )}
        <button className="btn btn-suave" style={{ marginTop: 18 }} onClick={alCerrar}>
          Cerrar
        </button>
      </section>
    </div>
  );
}

/** El botón de arriba que abre los archivos del repo (solo con un repo conectado). */
export function BotonArchivos({ alAbrir }: { alAbrir: () => void }) {
  return (
    <button onClick={alAbrir} className="pastilla" style={{ position: "absolute", top: 12, right: 460, zIndex: 6 }}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2.500h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
      Archivos
    </button>
  );
}
