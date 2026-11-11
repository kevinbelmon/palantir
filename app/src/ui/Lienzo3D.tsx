import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { textosDe } from "../contenido";
import { AGENTES, type EstadoAgente, type UbicacionBrief } from "../flujo";
import { elementoEn, factorRueda, SALAS, tiempoVisible, type Elemento } from "../oficina";
import {
  ESCALA_CASA,
  OJOS_EN_CASA,
  arrastrar3d,
  camara3dEnSala,
  camara3dInicial,
  construirMundo,
  FOV_VERTICAL,
  entradaDeSala,
  girarJugador,
  interpolar3d,
  JUGADOR_INICIAL,
  moverJugador,
  objetivoDeInteraccion,
  obstaculos,
  pantallaAPlano,
  posicionDeCamara,
  salaDe,
  zoom3d,
  type Camara3D,
  type Jugador,
  type ModoDeVista,
  type Mundo3D,
} from "../escena";
import { ALTO_BARRA } from "./BarraSuperior";
import { ALTO_DOCK } from "./Dock";
import type { Enfoque } from "./Lienzo";

type Props = {
  agentes: readonly EstadoAgente[];
  brief: UbicacionBrief;
  alElegir: (e: Elemento) => void;
  enfoque: Enfoque | null;
  /** Desde arriba, como una maqueta, o caminando por adentro. */
  modo?: ModoDeVista;
};

const DURACION_VIAJE_MS = 700;
const FOV_PERSONA = 72;

/** Lo que dice el cartelito cuando hay algo para tocar con «E». */
function textoDeInteraccion(e: Elemento): string {
  if (e.tipo === "papeleria") return "E · Dejar el brief en la papelería";
  const nombre = textosDe(AGENTES[e.indice].id).nombre;
  return e.tipo === "agente" ? `E · Hablar con ${nombre}` : `E · Leer lo que dejó ${nombre}`;
}

const escribiendo = () => {
  const t = document.activeElement?.tagName;
  return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
};

/**
 * La oficina en 3D. Desde arriba: clic derecho para mover, rueda para acercar, clic para elegir.
 * Caminando: mouse para mirar, W A S D para moverse, E para hablar con quien tengas adelante.
 */
export function Lienzo3D({ agentes, brief, alElegir, enfoque, modo = "arriba" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const vista = useRef({ agentes, brief });
  const elegir = useRef(alElegir);
  const camara = useRef<Camara3D | null>(null);
  const viaje = useRef<{ desde: Camara3D; hasta: Camara3D; inicio: number } | null>(null);
  const movida = useRef(false);
  const mundoRef = useRef<Mundo3D | null>(null);
  const modoRef = useRef<ModoDeVista>(modo);
  const jugador = useRef<Jugador>(JUGADOR_INICIAL);
  const jugadorUsado = useRef(false);
  const enfoqueRef = useRef<Enfoque | null>(enfoque);
  const [hud, setHud] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  useEffect(() => {
    vista.current = { agentes, brief };
    elegir.current = alElegir;
  });

  useEffect(() => {
    enfoqueRef.current = enfoque;
    const canvas = ref.current;
    if (!enfoque || !canvas) return;
    const tamano = { ancho: canvas.clientWidth, alto: canvas.clientHeight };
    const hasta = camara3dEnSala(SALAS[enfoque.indice], tamano, ALTO_BARRA, ALTO_DOCK);
    const desde = camara.current ?? camara3dInicial(tamano, ALTO_BARRA, ALTO_DOCK);
    movida.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camara.current = hasta;
      viaje.current = null;
    } else viaje.current = { desde, hasta, inicio: performance.now() };
  }, [enfoque]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // cine: curva de tonos filmica y reflejos de un interior, para que los materiales (mármol, madera, vidrio) brillen de verdad
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    const generador = new THREE.PMREMGenerator(renderer);
    const entorno = generador.fromScene(new RoomEnvironment(), 0.04).texture;
    generador.dispose();
    const mundo = construirMundo();
    mundo.escena.environment = entorno;
    mundo.escena.environmentIntensity = 0.45;
    mundoRef.current = mundo;
    mundo.ponerModo(modoRef.current);
    const lente = new THREE.PerspectiveCamera((FOV_VERTICAL * 180) / Math.PI, 1, 20, 30000);
    lente.rotation.order = "YXZ";
    const paredes = obstaculos();

    let raf = 0;
    const inicio = performance.now();
    let anterior = inicio;
    let arrastrando = false;
    let ultimo = { x: 0, y: 0 };
    let inicioClic: { x: number; y: number } | null = null;
    let ultimoMensaje = "";
    let modoDeLente: ModoDeVista | null = null;
    const teclas = new Set<string>();
    const pideQuietud = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducido = pideQuietud.matches;
    const alCambiarQuietud = () => (reducido = pideQuietud.matches);
    pideQuietud.addEventListener("change", alCambiarQuietud);

    const tamano = () => ({ ancho: canvas.clientWidth, alto: canvas.clientHeight });
    const terminados = () => vista.current.agentes.map((a) => a === "terminado");
    const caminando = () => modoRef.current === "persona";

    const ajustar = () => {
      const { ancho, alto } = tamano();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(ancho, alto, false);
      lente.aspect = ancho / Math.max(1, alto);
      lente.updateProjectionMatrix();
      if (!movida.current) camara.current = camara3dInicial({ ancho, alto }, ALTO_BARRA, ALTO_DOCK);
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(canvas);

    const interactuar = () => {
      const objetivo = objetivoDeInteraccion(jugador.current, terminados());
      if (!objetivo) return;
      document.exitPointerLock?.();
      elegir.current(objetivo);
    };

    const alBajar = (e: PointerEvent) => {
      if (caminando()) {
        if (e.button !== 0) return;
        inicioClic = { x: e.clientX, y: e.clientY };
        return;
      }
      if (e.button === 0) inicioClic = { x: e.clientX, y: e.clientY };
      if (e.button !== 2) return;
      arrastrando = true;
      viaje.current = null;
      ultimo = { x: e.clientX, y: e.clientY };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura: el arrastre sigue mientras el mouse esté sobre el lienzo */
      }
      canvas.style.cursor = "grabbing";
    };
    const alMover = (e: PointerEvent) => {
      if (caminando()) {
        // sin el mouse "capturado", se mira arrastrando con el botón izquierdo
        if (document.pointerLockElement !== canvas && (e.buttons & 1) === 1) jugador.current = girarJugador(jugador.current, e.movementX, e.movementY);
        return;
      }
      if (!arrastrando || !camara.current) return;
      const caja = canvas.getBoundingClientRect();
      camara.current = arrastrar3d(camara.current, e.clientX - ultimo.x, e.clientY - ultimo.y, tamano(), ultimo.x - caja.left, ultimo.y - caja.top);
      ultimo = { x: e.clientX, y: e.clientY };
      movida.current = true;
    };
    const alSoltar = (e: PointerEvent) => {
      if (caminando()) {
        if (e.button !== 0 || !inicioClic) return;
        const lejos = Math.hypot(e.clientX - inicioClic.x, e.clientY - inicioClic.y) > 6;
        inicioClic = null;
        if (lejos) return;
        if (document.pointerLockElement === canvas) interactuar();
        else {
          try {
            void canvas.requestPointerLock?.();
          } catch {
            /* sin captura del mouse: se mira arrastrando */
          }
        }
        return;
      }
      if (e.button === 0 && inicioClic && camara.current) {
        const lejos = Math.hypot(e.clientX - inicioClic.x, e.clientY - inicioClic.y) > 6;
        if (!lejos) {
          const caja = canvas.getBoundingClientRect();
          const punto = pantallaAPlano(camara.current, tamano(), e.clientX - caja.left, e.clientY - caja.top);
          // el piso que se ve "detrás" de un muñeco o un objeto alto queda más al norte: se prueba también un poco más al sur
          const elemento = punto ? [0, 70, 130].reduce<Elemento | null>((hallado, sur) => hallado ?? elementoEn(punto.x, punto.z + sur), null) : null;
          if (elemento) elegir.current(elemento);
        }
        inicioClic = null;
      }
      if (e.button !== 2) return;
      arrastrando = false;
      canvas.style.cursor = "";
    };
    const alRodar = (e: WheelEvent) => {
      e.preventDefault();
      if (caminando() || !camara.current) return;
      viaje.current = null;
      const caja = canvas.getBoundingClientRect();
      // factorRueda > 1 acerca (como en el mapa plano); acá la distancia baja al acercar
      camara.current = zoom3d(camara.current, 1 / factorRueda(e.deltaY), tamano(), e.clientX - caja.left, e.clientY - caja.top);
      movida.current = true;
    };
    const sinMenu = (e: Event) => e.preventDefault();
    const alMoverMouse = (e: MouseEvent) => {
      if (caminando() && document.pointerLockElement === canvas) jugador.current = girarJugador(jugador.current, e.movementX, e.movementY);
    };
    const alCambiarBloqueo = () => setBloqueado(document.pointerLockElement === canvas);
    const alTeclaAbajo = (e: KeyboardEvent) => {
      if (!caminando() || escribiendo()) return;
      if (e.code === "KeyE" && !e.repeat) interactuar();
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(e.code)) {
        teclas.add(e.code);
        e.preventDefault();
      }
    };
    const alTeclaArriba = (e: KeyboardEvent) => teclas.delete(e.code);
    const alPerderFoco = () => teclas.clear();

    canvas.addEventListener("pointerdown", alBajar);
    canvas.addEventListener("pointermove", alMover);
    canvas.addEventListener("pointerup", alSoltar);
    canvas.addEventListener("wheel", alRodar, { passive: false });
    canvas.addEventListener("contextmenu", sinMenu);
    document.addEventListener("mousemove", alMoverMouse);
    document.addEventListener("pointerlockchange", alCambiarBloqueo);
    window.addEventListener("keydown", alTeclaAbajo);
    window.addEventListener("keyup", alTeclaArriba);
    window.addEventListener("blur", alPerderFoco);

    const bucle = (ahora: number) => {
      const dt = Math.min(0.1, (ahora - anterior) / 1000);
      anterior = ahora;
      const t = tamano();
      const modoActual = modoRef.current;
      if (modoDeLente !== modoActual) {
        modoDeLente = modoActual;
        lente.fov = modoActual === "persona" ? FOV_PERSONA : (FOV_VERTICAL * 180) / Math.PI;
        lente.near = modoActual === "persona" ? 4 : 20;
        lente.updateProjectionMatrix();
      }

      if (modoActual === "persona") {
        const giro = (teclas.has("ArrowLeft") ? 1 : 0) - (teclas.has("ArrowRight") ? 1 : 0);
        if (giro !== 0) jugador.current = { ...jugador.current, yaw: jugador.current.yaw + giro * 1.8 * dt };
        const entrada = {
          adelante: (teclas.has("KeyW") || teclas.has("ArrowUp") ? 1 : 0) - (teclas.has("KeyS") || teclas.has("ArrowDown") ? 1 : 0),
          lateral: (teclas.has("KeyD") ? 1 : 0) - (teclas.has("KeyA") ? 1 : 0),
          correr: teclas.has("ShiftLeft") || teclas.has("ShiftRight"),
        };
        // a la gente que camina por la casa tampoco se la atraviesa
        const gente = mundo.personas().map((q) => ({ x: q.x - 18, y: q.z - 18, w: 36, h: 36 }));
        jugador.current = moverJugador(jugador.current, entrada, dt, gente.length ? [...paredes, ...gente] : paredes);
        const j = jugador.current;
        lente.position.set(j.x * ESCALA_CASA, OJOS_EN_CASA + (entrada.adelante !== 0 || entrada.lateral !== 0 ? Math.sin(ahora / 140) * 2.4 : 0), j.z * ESCALA_CASA);
        lente.rotation.set(j.pitch, j.yaw, 0);
        mundo.colocarJugador(null);
        const objetivo = objetivoDeInteraccion(j, terminados());
        const mensaje = objetivo ? textoDeInteraccion(objetivo) : "";
        if (mensaje !== ultimoMensaje) {
          ultimoMensaje = mensaje;
          setHud(mensaje);
        }
      } else {
        if (ultimoMensaje !== "") {
          ultimoMensaje = "";
          setHud("");
        }
        camara.current ??= camara3dInicial(t, ALTO_BARRA, ALTO_DOCK);
        const v = viaje.current;
        if (v) {
          const k = (ahora - v.inicio) / DURACION_VIAJE_MS;
          camara.current = interpolar3d(v.desde, v.hasta, k);
          if (k >= 1) viaje.current = null;
        }
        const c = camara.current;
        const pos = posicionDeCamara(c);
        lente.position.set(pos.x, pos.y, pos.z);
        lente.lookAt(c.x, 0, c.z);
        mundo.colocarJugador(jugadorUsado.current ? jugador.current : null);
      }
      mundo.actualizar(vista.current.agentes, vista.current.brief, tiempoVisible((ahora - inicio) / 1000, reducido));
      renderer.render(mundo.escena, lente);
      raf = requestAnimationFrame(bucle);
    };
    raf = requestAnimationFrame(bucle);

    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
      pideQuietud.removeEventListener("change", alCambiarQuietud);
      canvas.removeEventListener("pointerdown", alBajar);
      canvas.removeEventListener("pointermove", alMover);
      canvas.removeEventListener("pointerup", alSoltar);
      canvas.removeEventListener("wheel", alRodar);
      canvas.removeEventListener("contextmenu", sinMenu);
      document.removeEventListener("mousemove", alMoverMouse);
      document.removeEventListener("pointerlockchange", alCambiarBloqueo);
      window.removeEventListener("keydown", alTeclaAbajo);
      window.removeEventListener("keyup", alTeclaArriba);
      window.removeEventListener("blur", alPerderFoco);
      document.exitPointerLock?.();
      mundoRef.current = null;
      mundo.liberar();
      entorno.dispose();
      renderer.dispose();
    };
  }, []);

  // al cambiar de vista: se arma el mundo para ese modo, y al volver a mirar desde arriba la cámara viaja a donde estaba la persona
  useEffect(() => {
    modoRef.current = modo;
    mundoRef.current?.ponerModo(modo);
    const canvas = ref.current;
    if (!canvas) return;
    if (modo === "persona") {
      // si hay un agente elegido, se entra por su puerta; si no, se sigue desde donde se estaba
      if (!jugadorUsado.current && enfoqueRef.current) jugador.current = entradaDeSala(SALAS[enfoqueRef.current.indice]);
      jugadorUsado.current = true;
      return;
    }
    document.exitPointerLock?.();
    const tamano = { ancho: canvas.clientWidth, alto: canvas.clientHeight };
    const sala = salaDe(jugador.current);
    const hasta = sala !== null ? camara3dEnSala(SALAS[sala], tamano, ALTO_BARRA, ALTO_DOCK) : camara3dInicial(tamano, ALTO_BARRA, ALTO_DOCK);
    movida.current = true;
    viaje.current = { desde: camara.current ?? hasta, hasta, inicio: performance.now() };
  }, [modo]);

  const sombra = "0 1px 3px rgba(0,0,0,0.9)";
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={ref}
        aria-label="La oficina del modelo operativo en 3D: ocho salas, una por agente, alrededor de un lobby, y la papelería donde se deja el brief"
        style={{ display: "block", width: "100%", height: "100%", touchAction: "none", cursor: modo === "persona" ? "crosshair" : undefined }}
      />
      {modo === "persona" && (
        <>
          <div aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", width: 6, height: 6, marginLeft: -3, marginTop: -3, background: "#fff", boxShadow: "0 0 0 1px #000", pointerEvents: "none" }} />
          {hud && (
            <div role="status" style={{ position: "absolute", left: "50%", bottom: 130, transform: "translateX(-50%)", padding: "8px 16px", background: "#000", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: 15, fontWeight: 650, pointerEvents: "none" }}>
              {hud}
            </div>
          )}
          <div style={{ position: "absolute", left: 14, top: 14, padding: "8px 12px", background: "rgba(0,0,0,0.78)", color: "#e8e8e8", fontSize: 13, lineHeight: 1.5, textShadow: sombra, pointerEvents: "none", maxWidth: 320 }}>
            {bloqueado ? "W A S D para moverte · Shift para correr · E para hablar o tocar · Esc para soltar el mouse" : "Hacé clic en la pantalla para mirar con el mouse. Con W A S D te movés y con las flechas ← → girás."}
          </div>
        </>
      )}
    </div>
  );
}
