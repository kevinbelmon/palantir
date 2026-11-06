import { ejecutar, guardarYSubir } from "./repo.ts";

/** Los 8 comandos del camino principal, en el orden del juego. */
export const COMANDOS = ["sdd-refine", "sdd-generate", "sdd-validate", "sdd-log", "sdd-implement", "sdd-e2e", "sdd-checklist", "sdd-review"] as const;

/** Quién corre un comando en una carpeta y devuelve lo que contestó. */
export type Ejecutor = (carpeta: string, comando: string) => Promise<string>;

const VEINTE_MIN = 20 * 60_000;

/** Claude Code de la propia persona (su sesión ya iniciada), sin pedir nada. `CLAUDE_BIN` cambia el ejecutable. */
export const ejecutorClaude: Ejecutor = (carpeta, comando) => {
  const bin = process.env.CLAUDE_BIN ?? (process.platform === "win32" ? "claude.cmd" : "claude");
  return ejecutar(bin, ["-p", `/${comando}`, "--permission-mode", "acceptEdits"], carpeta, VEINTE_MIN);
};

/** Corre el agente `indice` de verdad y sube a GitHub lo que haya cambiado. */
export async function correrAgente(carpeta: string, indice: number, ejecutor: Ejecutor): Promise<{ salida: string; subido: boolean }> {
  const comando = COMANDOS[indice];
  if (!comando) throw new Error("Ese agente no existe.");
  const salida = (await ejecutor(carpeta, comando)).trim();
  const subido = await guardarYSubir(carpeta, `feat: ${comando} (corrido desde el juego)`);
  return { salida, subido };
}
