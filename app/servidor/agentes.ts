import { spawn } from "node:child_process";
import { actividadDe, resultadoDe } from "./actividad.ts";
import { guardarYSubir } from "./repo.ts";

/** Los 8 comandos del camino principal, en el orden del juego. */
export const COMANDOS = ["sdd-refine", "sdd-generate", "sdd-validate", "sdd-log", "sdd-implement", "sdd-e2e", "sdd-checklist", "sdd-review"] as const;

/** Quién corre un comando en una carpeta, avisa lo que va haciendo y devuelve su mensaje final. */
export type Ejecutor = (carpeta: string, comando: string, alActividad: (frase: string) => void) => Promise<string>;

const VEINTE_MIN = 20 * 60_000;

/**
 * Claude Code de la propia persona (su sesión ya iniciada). Se lo corre en modo seguimiento para ir contando qué hace.
 * La línea de comando se arma solo con valores fijos (`comando` sale de la lista de arriba), nunca con texto de la persona.
 * `CLAUDE_BIN` cambia el ejecutable.
 */
export const ejecutorClaude: Ejecutor = (carpeta, comando, alActividad) =>
  new Promise((ok, fallo) => {
    const bin = process.env.CLAUDE_BIN ?? "claude";
    const linea = `"${bin}" -p "/${comando}" --output-format stream-json --verbose --permission-mode acceptEdits`;
    const hijo = spawn(linea, { cwd: carpeta, shell: true, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let resto = "";
    let final: string | null = null;
    let errores = "";
    const tiempo = setTimeout(() => {
      hijo.kill();
      fallo(new Error("El agente tardó demasiado y se detuvo."));
    }, VEINTE_MIN);
    const procesar = (l: string) => {
      if (!l.trim()) return;
      for (const f of actividadDe(l)) alActividad(f);
      final = resultadoDe(l) ?? final;
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
      if (codigo === 0 || final !== null) ok(final ?? "");
      else fallo(new Error(`Claude no pudo correr el agente: ${errores.trim() || `salió con código ${codigo}`}`));
    });
  });

/** Corre el agente `indice` de verdad y sube a GitHub lo que haya cambiado. */
export async function correrAgente(carpeta: string, indice: number, ejecutor: Ejecutor, alActividad: (frase: string) => void = () => {}): Promise<{ salida: string; subido: boolean }> {
  const comando = COMANDOS[indice];
  if (!comando) throw new Error("Ese agente no existe.");
  const salida = (await ejecutor(carpeta, comando, alActividad)).trim();
  const subido = await guardarYSubir(carpeta, `feat: ${comando} (corrido desde el juego)`);
  return { salida, subido };
}
