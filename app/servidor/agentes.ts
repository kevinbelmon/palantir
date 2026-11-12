import { spawn } from "node:child_process";
import { actividadDe, resultadoDe, sesionDe } from "./actividad.ts";
import { guardarYSubir } from "./repo.ts";

/** Los 8 comandos del camino principal, en el orden del juego. */
export const COMANDOS = ["sdd-refine", "sdd-generate", "sdd-validate", "sdd-log", "sdd-implement", "sdd-e2e", "sdd-checklist", "sdd-review"] as const;

/** Lo que contesta el agente en un turno de la conversación, y la sesión para seguirla. */
export type Turno = { texto: string; sesion: string | null };

/**
 * Quién habla con el agente: corre `prompt` en `carpeta` (si hay `sesion`, sigue esa misma conversación),
 * avisa lo que va haciendo y devuelve su respuesta.
 */
export type Ejecutor = (carpeta: string, prompt: string, sesion: string | null, alActividad: (frase: string) => void) => Promise<Turno>;

const VEINTE_MIN = 20 * 60_000;
const SESION = /^[A-Za-z0-9-]{8,64}$/;

/** Lo que se le pide a Claude además del comando: que le hable a alguien que no programa. Va sin comillas dobles. */
const ESTILO =
  "Quien te habla no sabe programar. Explicá cada paso en español simple, paso a paso, sin jerga: si usás una palabra técnica, explicala en la misma frase. Cuando necesites una decisión, hacé una sola pregunta por vez, con ejemplos concretos.";

/**
 * El entorno con el que corre el agente. Si la compu tiene una clave de API suelta (`ANTHROPIC_API_KEY` o similares), Claude Code
 * la usa en vez de la sesión iniciada de la persona, y si está vencida o es de otra cuenta falla con «Invalid API key».
 * Por eso se sacan: el juego usa siempre la sesión de la persona. Quien de verdad quiera usar su clave pone `SDD_USAR_API_KEY=1`.
 */
export function entornoDelAgente(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (env.SDD_USAR_API_KEY === "1") return env;
  // en Windows los nombres de variables no distinguen mayúsculas: «Anthropic_Api_Key» es la misma variable
  const sueltas = new Set(["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"]);
  return Object.fromEntries(Object.entries(env).filter(([nombre]) => !sueltas.has(nombre.toUpperCase())));
}

/**
 * Claude Code de la propia persona (su sesión ya iniciada), en modo seguimiento para ir contando qué hace.
 * El pedido viaja por la entrada estándar: nada de lo que escribe la persona forma parte de la línea de comando.
 * La sesión se valida antes de usarla. `CLAUDE_BIN` cambia el ejecutable.
 */
export const ejecutorClaude: Ejecutor = (carpeta, prompt, sesion, alActividad) =>
  new Promise((ok, fallo) => {
    if (sesion !== null && !SESION.test(sesion)) return fallo(new Error("La conversación guardada no es válida."));
    const bin = process.env.CLAUDE_BIN ?? "claude";
    const linea = `"${bin}" -p --output-format stream-json --verbose --permission-mode acceptEdits --append-system-prompt "${ESTILO}"${sesion ? ` --resume ${sesion}` : ""}`;
    const hijo = spawn(linea, { cwd: carpeta, env: entornoDelAgente(process.env), shell: true, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let resto = "";
    let final: string | null = null;
    let sesionNueva: string | null = sesion;
    let errores = "";
    const tiempo = setTimeout(() => {
      hijo.kill();
      fallo(new Error("El agente tardó demasiado y se detuvo."));
    }, VEINTE_MIN);
    const procesar = (l: string) => {
      if (!l.trim()) return;
      for (const f of actividadDe(l)) alActividad(f);
      final = resultadoDe(l) ?? final;
      const s = sesionDe(l);
      if (s && SESION.test(s)) sesionNueva = s;
    };
    hijo.stdout.on("data", (c: Buffer) => {
      const partes = (resto + c.toString("utf8")).split("\n");
      resto = partes.pop() ?? "";
      partes.forEach(procesar);
    });
    hijo.stderr.on("data", (c: Buffer) => (errores = (errores + c.toString("utf8")).slice(-400)));
    hijo.on("error", (e) => {
      clearTimeout(tiempo);
      fallo(e);
    });
    hijo.on("close", (codigo) => {
      clearTimeout(tiempo);
      procesar(resto);
      if (codigo === 0 || final !== null) ok({ texto: final ?? "", sesion: sesionNueva });
      else fallo(new Error(`Claude no pudo correr el agente: ${errores.trim() || `salió con código ${codigo}`}`));
    });
    hijo.stdin.on("error", () => {});
    hijo.stdin.end(prompt);
  });

/** Un turno con el agente `indice`: la primera vez corre su comando; después sigue la conversación con lo que escribió la persona. Sube lo que cambió. */
export async function correrAgente(
  carpeta: string,
  indice: number,
  ejecutor: Ejecutor,
  opciones: { sesion?: string | null; texto?: string; alActividad?: (frase: string) => void } = {},
): Promise<{ salida: string; sesion: string | null; subido: boolean }> {
  const comando = COMANDOS[indice];
  if (!comando) throw new Error("Ese agente no existe.");
  const prompt = opciones.texto ?? `/${comando}`;
  const turno = await ejecutor(carpeta, prompt, opciones.sesion ?? null, opciones.alActividad ?? (() => {}));
  const subido = await guardarYSubir(carpeta, `feat: ${comando} (corrido desde el juego)`);
  return { salida: turno.texto.trim(), sesion: turno.sesion, subido };
}
