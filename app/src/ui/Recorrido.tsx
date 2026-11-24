import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APARIENCIAS } from "../oficina";
import { CaraDelBot } from "./Bot";
import { CAPITULOS, COMANDOS_DEL_MODELO, duracionDePaso, duracionDeTipeo, LETRAS_POR_SEGUNDO, PRESENTACION } from "./recorridoGuion";
import type { Recorrido } from "./recorridoReloj";

/** Cuánto lugar se deja abajo del mapa para que la burbuja de Zac no tape la oficina. */
export const ALTO_ZAC = 250;

/** La marca del juego: los cuatro cuadrados de la barra de arriba. */
function Marca() {
  return (
    <div aria-hidden="true" style={{ display: "flex", gap: 5 }}>
      {["#5b8cff", "#8e6bff", "#3ecf6e", "#ffd54a"].map((c) => (
        <span key={c} style={{ width: 13, height: 13, background: c }} />
      ))}
    </div>
  );
}

/** «1. Refine» → { numero: "1", nombre: "Refine" }; si el título no empieza con un número, solo el nombre. */
function partirTitulo(titulo: string): { numero: string | null; nombre: string } {
  const m = /^(\d+)\.\s*(.*)$/.exec(titulo);
  return m ? { numero: m[1], nombre: m[2] } : { numero: null, nombre: titulo };
}

/**
 * La presentación de bienvenida: pantalla completa, negra y sin nada más. Explica qué es el SDD en tres páginas y,
 * cuando la persona da el OK, arranca el recorrido. El encabezado y los botones no se mueven entre páginas:
 * solo cambia lo del medio.
 */
function Presentacion({ tour }: { tour: Recorrido }) {
  const [pagina, setPagina] = useState(0);
  const ultima = pagina === PRESENTACION.length - 1;
  const p = PRESENTACION[pagina];

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") tour.irAlJuego();
      else if (e.key === "ArrowLeft") setPagina((n) => Math.max(0, n - 1));
      else if (e.key === "ArrowRight") setPagina((n) => Math.min(PRESENTACION.length - 1, n + 1));
      else if (e.key === "Enter") {
        if (ultima) tour.empezar();
        else setPagina((n) => n + 1);
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [ultima, tour]);

  const ocho = (p.puntos?.length ?? 0) > 4;
  const lateral = "clamp(20px, 6vw, 80px)";
  return (
    <div role="dialog" aria-label="Bienvenida al SDD" style={{ position: "fixed", inset: 0, zIndex: 40, background: "#000", color: "var(--texto)", display: "flex", flexDirection: "column", overflow: "auto" }}>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(circle at 50% 50%, #000 22%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 22%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* arriba: siempre igual */}
      <header style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, padding: `clamp(16px, 3.5vh, 36px) ${lateral} 0`, width: "min(1180px, 100%)", margin: "0 auto" }}>
        <CaraDelBot tam={52} />
        <div style={{ flex: 1 }}>
          <Marca />
          <div style={{ marginTop: 7, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--aviso)" }}>Spec-Driven Development</div>
        </div>
        {!ultima && (
          <button className="btn btn-suave" onClick={tour.irAlJuego}>
            Saltear presentación
          </button>
        )}
      </header>

      {/* en el medio: lo único que cambia entre páginas */}
      <main style={{ position: "relative", flex: 1, width: "min(1180px, 100%)", margin: "0 auto", padding: `clamp(8px, 2vh, 32px) ${lateral}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div key={pagina} className="aparece" style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 2vh, 26px)" }}>
          <h1 style={{ margin: 0, color: "var(--texto)", fontSize: "clamp(26px, 5.4vh, 58px)", lineHeight: 1.05, letterSpacing: "-0.035em", fontWeight: 800 }}>{p.titulo}</h1>
          {p.texto && <p style={{ margin: 0, maxWidth: 880, color: "#d6d6d6", fontSize: "clamp(15px, 2.4vh, 23px)", lineHeight: 1.55 }}>{p.texto}</p>}
          {p.puntos && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: ocho ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(240px, 1fr))", gap: ocho ? "clamp(6px, 1vh, 10px)" : 14 }}>
              {p.puntos.map((x, i) => {
                const { numero, nombre } = partirTitulo(x.titulo);
                const color = ocho ? APARIENCIAS[i % APARIENCIAS.length].camisa : "var(--aviso)";
                return (
                  <li key={x.titulo} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: ocho ? "clamp(7px, 1.3vh, 12px) 16px" : "20px 22px", background: "rgba(255,255,255,0.06)", borderLeft: `3px solid ${color}` }}>
                    {numero && (
                      <span aria-hidden="true" style={{ flex: "none", width: ocho ? 30 : 38, height: ocho ? 30 : 38, display: "grid", placeItems: "center", background: ocho ? `${color}2e` : "var(--aviso)", color: ocho ? color : "#000", fontWeight: 800, fontSize: ocho ? 14 : 18 }}>
                        {numero}
                      </span>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "var(--texto)", fontSize: ocho ? "clamp(15px, 1.9vh, 18px)" : 21, fontWeight: 750 }}>{nombre}</div>
                      <div style={{ marginTop: 4, color: "#bdbdbd", fontSize: ocho ? "clamp(13px, 1.7vh, 15px)" : 17, lineHeight: 1.45 }}>{x.texto}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {/* abajo: siempre en el mismo lugar */}
      <footer style={{ position: "sticky", bottom: 0, zIndex: 1, width: "min(1180px, 100%)", margin: "0 auto", padding: `14px ${lateral} clamp(12px, 3vh, 34px)`, background: "linear-gradient(rgba(0,0,0,0), #000 28%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div role="group" aria-label={`Página ${pagina + 1} de ${PRESENTACION.length}`} style={{ display: "flex", gap: 6, marginRight: 10 }}>
            {PRESENTACION.map((x, i) => (
              <span key={x.titulo} aria-hidden="true" style={{ width: i === pagina ? 30 : 12, height: 4, background: i === pagina ? "var(--aviso)" : "rgba(255,255,255,0.28)", transition: "width 0.2s" }} />
            ))}
          </div>
          <button className="btn btn-suave" onClick={() => setPagina(pagina - 1)} disabled={pagina === 0}>
            Atrás
          </button>
          {ultima ? (
            <>
              <button className="btn" onClick={tour.empezar} autoFocus style={{ padding: "11px 26px", fontSize: 16 }}>
                Empezar el recorrido
              </button>
              <button className="btn btn-suave" onClick={tour.irAlJuego}>
                Ir directo al juego
              </button>
            </>
          ) : (
            <button className="btn" onClick={() => setPagina(pagina + 1)} autoFocus style={{ padding: "11px 26px", fontSize: 16 }}>
              Siguiente
            </button>
          )}
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: "#8c8c8c" }}>
          {ultima ? `Son ${COMANDOS_DEL_MODELO} comandos en total. El recorrido explica estos ocho, uno por uno.` : "Enter avanza · ← → cambian de página · Esc salta la presentación"}
        </div>
      </footer>
    </div>
  );
}

/** El velo oscuro de los bordes: la mirada se va al centro, donde la cámara puso lo que Zac está explicando. */
function Velo({ marcado }: { marcado: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 6,
        pointerEvents: "none",
        background: "radial-gradient(ellipse 62% 58% at 50% 42%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.62) 100%)",
        opacity: marcado ? 1 : 0.35,
        transition: "opacity 0.8s ease",
      }}
    />
  );
}

/** La barra de arriba: un tramo por capítulo. Se puede tocar uno para saltar. */
function Capitulos({ tour }: { tour: Recorrido }) {
  const actual = tour.actual.capitulo;
  return (
    <nav aria-label="Capítulos del recorrido" style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 8, display: "flex", gap: 4, width: "min(760px, calc(100vw - 220px))" }}>
      {CAPITULOS.map((nombre, i) => (
        <button
          key={nombre}
          onClick={() => tour.irACapitulo(i)}
          aria-label={`Ir a ${nombre}`}
          aria-current={i === actual ? "step" : undefined}
          title={nombre}
          style={{ flex: 1, height: 18, padding: 0, border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <span style={{ width: "100%", height: i === actual ? 5 : 3, background: i < actual ? "var(--ok)" : i === actual ? "var(--aviso)" : "rgba(255,255,255,0.28)", transition: "height 0.2s" }} />
        </button>
      ))}
    </nav>
  );
}

/**
 * Las animaciones de la burbuja viven en CSS: el navegador las lleva solo, sin que el juego tenga que volver a dibujar nada.
 * Las palabras NO empiezan ocultas por defecto: la animación las esconde hasta que les toca (`both`), así que si por algún
 * motivo no corre, el texto se lee igual.
 */
const ANIMACIONES = `
@keyframes zac-palabra { from { opacity: 0; } to { opacity: 1; } }
@keyframes zac-avance { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.zac-palabra { animation: zac-palabra 0.22s ease-out both; }
`;

/** Las palabras del texto con el momento (en milisegundos del paso) en que le toca aparecer a cada una. */
function palabrasConTiempo(texto: string): { palabra: string; ms: number }[] {
  let letras = 0;
  return texto.split(" ").map((palabra) => {
    const ms = (letras / LETRAS_POR_SEGUNDO) * 1000;
    letras += palabra.length + 1;
    return { palabra, ms };
  });
}

/**
 * Zac, abajo al centro: su cara, lo que dice y los controles, como los de un video.
 * El texto se arma completo una sola vez y las palabras van apareciendo con una animación de CSS: no hay reloj que
 * redibuje nada mientras Zac "escribe". Solo hay un temporizador por paso para pasar al siguiente.
 * Se la crea de nuevo en cada paso (por la `key`), así todo arranca de cero.
 */
function Burbuja({ tour }: { tour: Recorrido }) {
  const p = tour.actual;
  const { pausado, velocidad, siguiente, anterior, reiniciarPaso, alternarPausa, irAlJuego, paso } = tour;
  const duracion = duracionDePaso(p);
  const tipeo = duracionDeTipeo(p);
  const ultimo = paso === tour.pasos.length - 1;
  const palabras = useMemo(() => palabrasConTiempo(p.texto), [p.texto]);

  // cuánto del paso pasó (en milisegundos del paso), para poder pausar y seguir sin perder el hilo
  const transcurrido = useRef(0);
  const arranque = useRef(0);
  const [hablando, setHablando] = useState(true);

  useEffect(() => {
    if (pausado) return;
    arranque.current = performance.now();
    const falta = Math.max(0, duracion - transcurrido.current) / velocidad;
    const alFinal = ultimo ? null : setTimeout(siguiente, falta);
    const alCallar = setTimeout(() => setHablando(false), Math.max(0, tipeo - transcurrido.current) / velocidad);
    return () => {
      if (alFinal) clearTimeout(alFinal);
      clearTimeout(alCallar);
      transcurrido.current += (performance.now() - arranque.current) * velocidad;
    };
  }, [pausado, velocidad, duracion, tipeo, ultimo, siguiente]);

  // «Atrás» repite el paso si ya pasó un rato; si recién empezó, vuelve al anterior
  const atras = useCallback(() => {
    const ahora = transcurrido.current + (pausado ? 0 : (performance.now() - arranque.current) * velocidad);
    if (ahora > 2500 || paso === 0) reiniciarPaso();
    else anterior();
  }, [paso, pausado, velocidad, reiniciarPaso, anterior]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") irAlJuego();
      else if (e.code === "Space") {
        e.preventDefault();
        alternarPausa();
      } else if (e.key === "ArrowRight") siguiente();
      else if (e.key === "ArrowLeft") atras();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [irAlJuego, alternarPausa, siguiente, atras]);

  const estado = pausado ? "paused" : "running";
  return (
    <aside role="complementary" aria-label="Zac, el guía del recorrido" className="panel" style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 8, width: "min(860px, calc(100vw - 44px))", padding: "0 0 14px", borderLeft: "3px solid var(--aviso)", overflow: "hidden" }}>
      <style>{ANIMACIONES}</style>
      <div aria-hidden="true" style={{ height: 3, background: "rgba(255,255,255,0.12)" }}>
        <div style={{ height: "100%", background: "var(--aviso)", transformOrigin: "left", animation: `zac-avance ${duracion / velocidad}ms linear forwards`, animationPlayState: estado }} />
      </div>
      <div style={{ display: "flex", gap: 20, padding: "16px 22px 0", alignItems: "flex-start" }}>
        <CaraDelBot tam={72} hablando={hablando && !pausado} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--texto-suave)" }}>Zac · {CAPITULOS[p.capitulo]}</div>
          <h2 className="aparece" style={{ margin: "4px 0 8px", fontSize: 24, fontWeight: 750, letterSpacing: "-0.02em" }}>
            {p.titulo}
          </h2>
          {/* el texto ya está armado y ocupa su lugar completo: solo se va revelando, palabra por palabra */}
          <p aria-label={p.texto} style={{ margin: 0, fontSize: 19, lineHeight: 1.55, minHeight: "4.65em" }}>
            {palabras.map((w, i) => (
              <span key={i} aria-hidden="true" className="zac-palabra" style={{ animationDelay: `${w.ms / velocidad}ms`, animationPlayState: estado }}>
                {w.palabra}{" "}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px 0 114px" }}>
        <button className="btn btn-suave" onClick={atras} style={{ padding: "7px 14px" }}>
          ◀ Atrás
        </button>
        <button className="btn btn-suave" onClick={alternarPausa} aria-pressed={pausado} style={{ padding: "7px 14px", minWidth: 96 }}>
          {pausado ? "▶ Seguir" : "❚❚ Pausa"}
        </button>
        {ultimo ? (
          <button className="btn" onClick={irAlJuego} style={{ padding: "7px 18px" }}>
            Empezar a jugar
          </button>
        ) : (
          <button className="btn" onClick={siguiente} style={{ padding: "7px 18px" }}>
            Siguiente ▶
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button className="btn btn-suave" onClick={tour.alternarVelocidad} aria-label={`Velocidad ${velocidad === 1 ? "normal" : "rápida"}`} style={{ padding: "7px 12px", fontSize: 13 }}>
          {velocidad === 1 ? "Velocidad normal" : "Más rápido"}
        </button>
      </div>
    </aside>
  );
}

/** Todo lo que se dibuja encima del juego: la presentación, y durante el recorrido el velo, los capítulos, Zac y el botón de salir. */
export function RecorridoCapa({ tour }: { tour: Recorrido }) {
  if (tour.presentacion) return <Presentacion tour={tour} />;
  if (!tour.activo) return null;
  return (
    <>
      <Velo marcado={tour.actual.marca !== null} />
      <Capitulos tour={tour} />
      <button className="btn btn-suave" onClick={tour.irAlJuego} aria-label="Salir del recorrido" style={{ position: "absolute", top: 12, right: 16, zIndex: 9, padding: "7px 14px" }}>
        Salir ✕
      </button>
      <Burbuja key={tour.clave} tour={tour} />
    </>
  );
}
