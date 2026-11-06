/** Traduce una línea del seguimiento de Claude Code a frases que cualquiera entiende. */

const corto = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const archivo = (v: unknown) => (typeof v === "string" ? v.replace(/\\/g, "/").split("/").slice(-3).join("/") : "un archivo");

function deHerramienta(nombre: string, entrada: Record<string, unknown>): string {
  switch (nombre) {
    case "Read":
      return `Lee ${archivo(entrada.file_path)}`;
    case "Write":
      return `Escribe ${archivo(entrada.file_path)}`;
    case "Edit":
    case "MultiEdit":
    case "NotebookEdit":
      return `Modifica ${archivo(entrada.file_path)}`;
    case "Grep":
    case "Glob":
      return "Busca en el proyecto";
    case "Bash":
      return "Corre un comando";
    case "Task":
    case "Agent":
      return "Le pide ayuda a otro agente";
    case "TodoWrite":
      return "Arma su lista de pasos";
    default:
      return `Usa la herramienta ${nombre}`;
  }
}

/** Una línea JSON del seguimiento → cero o más frases. Lo que no se entiende se ignora. */
export function actividadDe(linea: string): string[] {
  let evento: unknown;
  try {
    evento = JSON.parse(linea);
  } catch {
    return [];
  }
  if (typeof evento !== "object" || evento === null) return [];
  const e = evento as { type?: unknown; message?: { content?: unknown } };
  if (e.type !== "assistant" || !Array.isArray(e.message?.content)) return [];
  const frases: string[] = [];
  for (const parte of e.message.content as unknown[]) {
    if (typeof parte !== "object" || parte === null) continue;
    const p = parte as { type?: unknown; text?: unknown; name?: unknown; input?: unknown };
    if (p.type === "text" && typeof p.text === "string" && p.text.trim()) frases.push(`Dice: ${corto(p.text.trim().replace(/\s+/g, " "))}`);
    if (p.type === "tool_use" && typeof p.name === "string") frases.push(deHerramienta(p.name, typeof p.input === "object" && p.input !== null ? (p.input as Record<string, unknown>) : {}));
  }
  return frases;
}

/** El mensaje final de una corrida: viene en el evento `result`. */
export function resultadoDe(linea: string): string | null {
  try {
    const e = JSON.parse(linea) as { type?: unknown; result?: unknown };
    return e.type === "result" && typeof e.result === "string" ? e.result : null;
  } catch {
    return null;
  }
}
