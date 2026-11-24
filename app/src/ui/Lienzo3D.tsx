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
  camara3dEnZona,
  camara3dInicial,
  construirMundo,
  crearPostproceso,
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
import { crearMedidorDeFps, EFECTOS_POR_NIVEL, NIVEL_MAXIMO, nivelSegunFps, PROPORCION_POR_NIVEL, SOMBRA_CADA_NIVEL } from "../escena/calidad";
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
  /** Cuánto espacio libre dejar abajo antes de encuadrar (por defecto, el alto del dock). */
  margenInferior?: number;
  /** Un lugar del plano para señalar con un marco amarillo (el recorrido explicado); `null` no señala nada. */
  marca?: { x: number; y: number; w: number; h: number } | null;
  /** Deja de dibujar (por ejemplo, mientras se ve la presentación de pantalla completa): la compu descansa. */
  pausar?: boolean;
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
export function Lienzo3D({ agentes, brief, alElegir, enfoque, modo = "arriba", margenInferior, marca = null, pausar = false }: Props) {
  // en el modo demo el mapa termina arriba de la franja de la explicación, así que no hay que dejar
  // el hueco del dock: el encuadre sale centrado en el espacio que de verdad se ve
  const INFERIOR = margenInferior ?? ALTO_DOCK;
  const ref = useRef<HTMLCanvasElement>(null);
  const vista = useRef({ agentes, brief });
  const elegir = useRef(alElegir);
  const camara = useRef<Camara3D | null>(null);
  const viaje = useRef<{ desde: Camara3D; hasta: Camara3D; inicio: number; duracion?: number; arco?: number } | null>(null);
  const movida = useRef(false);
  const mundoRef = useRef<Mundo3D | null>(null);
  const pausaRef = useRef(pausar);
  useEffect(() => {
    pausaRef.current = pausar;
  }, [pausar]);
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
    // con `zona` se encuadra un pedazo del plano (la oficina y su alrededor); sin `zona`, la sala entera
    const hasta = enfoque.zona ? camara3dEnZona(enfoque.zona, tamano, ALTO_BARRA, INFERIOR) : camara3dEnSala(SALAS[enfoque.indice], tamano, ALTO_BARRA, INFERIOR);
    const desde = camara.current ?? camara3dInicial(tamano, ALTO_BARRA, INFERIOR);
    movida.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camara.current = hasta;
      viaje.current = null;
    } else {
      // con duración propia (el recorrido explicado) el viaje es más lento y se aleja un poco a mitad de camino, tanto más cuanto más largo es
      const salto = Math.hypot(hasta.x - desde.x, hasta.z - desde.z);
      const arco = enfoque.duracion ? Math.min(0.45, salto / 2400) * Math.max(desde.distancia, hasta.distancia) : 0;
      viaje.current = { desde, hasta, inicio: performance.now(), duracion: enfoque.duracion, arco };
    }
  }, [enfoque]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    // sombras suaves: el borde duro es lo que más delata una escena de bloques
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // el mapa de sombras es lo más caro de cada cuadro: se vuelve a dibujar cada tanto, no en todos (la gente se mueve despacio)
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    // cine: curva de tonos filmica y reflejos de un interior, para que los materiales (mármol, madera, vidrio) brillen de verdad
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    const generador = new THREE.PMREMGenerator(renderer);
    const entorno = generador.fromScene(new RoomEnvironment(), 0.04).texture;
    generador.dispose();
    const mundo = construirMundo();
    // texturas bien nítidas aunque se las mire de costado (el piso con la cámara inclinada): filtrado anisotrópico al máximo
    const nitidez = renderer.capabilities.getMaxAnisotropy();
    const afinadas = new Set<THREE.Texture>();
    mundo.escena.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
        const e = mat as THREE.MeshStandardMaterial;
        for (const t of [e.map, e.normalMap, e.roughnessMap, e.emissiveMap, e.aoMap]) {
          if (t && !afinadas.has(t)) {
            afinadas.add(t);
            t.anisotropy = nitidez;
          }
        }
      }
    });
    mundo.escena.environment = entorno;
    mundo.escena.environmentIntensity = 0.55;
    mundoRef.current = mundo;
    mundo.ponerModo(modoRef.current);
    const lente = new THREE.PerspectiveCamera((FOV_VERTICAL * 180) / Math.PI, 1, 20, 30000);
    lente.rotation.order = "YXZ";
    const paredes = obstaculos();
    // oclusión, brillo, viñeta y grano: lo que hace que la casa se vea a cine y no a dibujo
    const post = crearPostproceso(renderer, mundo.escena, lente, canvas.clientWidth || 1, canvas.clientHeight || 1);

    // calidad adaptable: si la compu no da abasto, se bajan los efectos y la resolución de a poco
    let nivel = 0;
    let conEfectos = EFECTOS_POR_NIVEL[0];
    let cuadro = 0;
    const medidor = crearMedidorDeFps();

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
      const proporcion = Math.min(window.devicePixelRatio || 1, PROPORCION_POR_NIVEL[nivel]);
      renderer.setPixelRatio(proporcion);
      renderer.setSize(ancho, alto, false);
      post.ajustar(ancho, alto, proporcion);
      lente.aspect = ancho / Math.max(1, alto);
      lente.updateProjectionMatrix();
      if (!movida.current) camara.current = camara3dInicial({ ancho, alto }, ALTO_BARRA, INFERIOR);
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
      if (pausaRef.current) {
        anterior = ahora;
        medidor.reiniciar();
        raf = requestAnimationFrame(bucle);
        return;
      }
      const dt = Math.min(0.1, (ahora - anterior) / 1000);
      anterior = ahora;
      const t = tamano();
      const modoActual = modoRef.current;
      if (modoDeLente !== modoActual) {
        modoDeLente = modoActual;
        renderer.shadowMap.needsUpdate = true;
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
        camara.current ??= camara3dInicial(t, ALTO_BARRA, INFERIOR);
        const v = viaje.current;
        if (v) {
          const k = (ahora - v.inicio) / (v.duracion ?? DURACION_VIAJE_MS);
          camara.current = interpolar3d(v.desde, v.hasta, k, v.arco);
          if (k >= 1) viaje.current = null;
        }
        const c = camara.current;
        const pos = posicionDeCamara(c);
        lente.position.set(pos.x, pos.y, pos.z);
        lente.lookAt(c.x, 0, c.z);
        mundo.colocarJugador(jugadorUsado.current ? jugador.current : null);
      }
      mundo.actualizar(vista.current.agentes, vista.current.brief, tiempoVisible((ahora - inicio) / 1000, reducido));
      cuadro += 1;
      if (cuadro % SOMBRA_CADA_NIVEL[nivel] === 0) renderer.shadowMap.needsUpdate = true;
      if (conEfectos) post.render(mundo.escena, lente);
      else renderer.render(mundo.escena, lente);
      const fps = medidor.cuadro(ahora);
      if (fps !== null) {
        const nuevo = nivelSegunFps(nivel, fps);
        if (nuevo !== nivel) {
          nivel = nuevo;
          conEfectos = EFECTOS_POR_NIVEL[nivel];
          ajustar();
          console.info(`[calidad] ${fps.toFixed(0)} cuadros por segundo: bajo al nivel ${nivel} de ${NIVEL_MAXIMO} (efectos: ${conEfectos ? "sí" : "no"}, resolución: ${PROPORCION_POR_NIVEL[nivel]})`);
        }
      }
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
      post.liberar();
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
    const hasta = sala !== null ? camara3dEnSala(SALAS[sala], tamano, ALTO_BARRA, INFERIOR) : camara3dInicial(tamano, ALTO_BARRA, INFERIOR);
    movida.current = true;
    viaje.current = { desde: camara.current ?? hasta, hasta, inicio: performance.now() };
  }, [modo]);

  // el marco amarillo del recorrido explicado
  useEffect(() => {
    mundoRef.current?.marcar(marca);
  }, [marca]);

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
