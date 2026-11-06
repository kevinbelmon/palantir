/** ¿Puede este navegador mostrar 3D? Sin navegador (o sin WebGL) dice que no, en vez de romperse. */
export function soportaWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const lienzo = document.createElement("canvas");
    return !!(lienzo.getContext("webgl2") ?? lienzo.getContext("webgl"));
  } catch {
    return false;
  }
}
