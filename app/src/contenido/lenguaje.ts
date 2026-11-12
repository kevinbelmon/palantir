/**
 * Palabras de programación que no deberían aparecer en lo que lee la persona.
 * (Los nombres de los comandos, como «Refine», se explican en español: no son jerga.)
 */
const JERGA = [
  "endpoint",
  "api",
  "backend",
  "frontend",
  "framework",
  "refactor",
  "deploy",
  "pipeline",
  "commit",
  "merge",
  "branch",
  "repo",
  "repositorio",
  "pull request",
  "tdd",
  "stack",
  "bug",
  "debug",
  "runtime",
  "query",
  "schema",
  "json",
  "mock",
  "linter",
  "dependencia",
  "webhook",
  "docker",
  "localhost",
];

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Las palabras técnicas que aparecen en el texto, en el orden en que aparecen. */
export function palabrasTecnicas(texto: string): string[] {
  const minusculas = texto.toLowerCase();
  const encontradas: { palabra: string; pos: number }[] = [];
  for (const palabra of JERGA) {
    const m = new RegExp(`(^|[^\\p{L}\\p{N}])${escapar(palabra)}(?![\\p{L}\\p{N}])`, "u").exec(minusculas);
    if (m) encontradas.push({ palabra, pos: m.index });
  }
  return encontradas.sort((a, b) => a.pos - b.pos).map((x) => x.palabra);
}

/** Cuántas palabras tiene la oración más larga del texto. */
export function oracionMasLarga(texto: string): number {
  return texto
    .split(/[.!?¡¿\n]+/)
    .map((o) => o.trim().split(/\s+/).filter(Boolean).length)
    .reduce((max, n) => Math.max(max, n), 0);
}
