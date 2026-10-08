// scripts/lib/tasks.mjs — parser único de tasks.md.
//
// Antes, el mismo parseo vivía copiado en tres lugares con el riesgo escrito en
// los comentarios ("Idéntico a taskCounts()... los dos tienen que contar igual"):
//   - sdd-audit.mjs  taskCounts()   cuenta progreso (checkbox)
//   - sdd-audit.mjs  CHECK 6        trazabilidad US-N (checkbox opcional, por bloque)
//   - lib/estado.mjs RE_TASK/_TABLA cuenta progreso + detecta formato tabla
// Copias que coinciden hoy porque se sincronizaron a mano, y que divergen al
// próximo cambio: de ahí salieron el bug de la negrita y el doble defecto de CHECK 6.
//
// Esta es la única definición. Tres conjuntos de líneas, cada uno con su razón:
//   checkbox   `- [x] **T001** …`   progreso: con checkbox se sabe qué está hecho
//   header     `- **T001** …`       encabezado SIN checkbox — CHECK 6 igual lo mira
//   tabla      `| T01 | … |`        fixture legacy; se cuenta pero no "hechas"
//
// Decisión deliberada: se conserva `T\d{3}` (exactamente tres dígitos) del código
// previo, no `T\d+`. Cambiarlo alteraría qué cuenta en repos existentes; esto es
// una unificación sin cambio de comportamiento, verificada por el selftest.

// Checkbox obligatorio → grupo 1 = estado, grupo 2 = id. Sin `\b` final a
// propósito: agregarlo cambiaría el match de IDs de 4+ dígitos.
const CHECKBOX = /^[ \t]*[-*][ \t]*\[([ xX])\][ \t]*\*{0,2}(T\d{3})/;
// Encabezado con checkbox OPCIONAL → grupo 1 = id. Es el conjunto que mira CHECK 6.
const HEADER = /^[ \t]*[-*][ \t]*(?:\[[ xX]\][ \t]*)?\*{0,2}(T\d{3})/;
// Fila de tabla `| T01 | … |` → grupo 1 = id. Acepta cualquier cantidad de dígitos.
const TABLE = /^[ \t]*\|[ \t]*(T\d+)[ \t]*\|/;
// `US-1`, `US: —`, `US-1, US-5` → una referencia (o el placeholder `—`) cuenta.
const US_REF = /US[-:]\s*[\d—–-]/;

/**
 * Parsea el contenido de un tasks.md a una vista de datos.
 *
 * @param {string} content  el texto del archivo (el "no existe" lo maneja el caller)
 * @returns {{
 *   format: "canonico"|"tabla"|"ninguno",
 *   checkbox: { total: number, done: number },   // solo tareas con checkbox
 *   tableRows: number,
 *   headers: Array<{ id: string, done: boolean|null, us: boolean }>,  // conjunto de CHECK 6
 *   sinUS: string[],                              // ids de headers cuyo bloque no tiene US-N
 * }}
 *
 * `headers` incluye tanto las líneas con checkbox como las que son encabezado sin
 * él. La detección de US-N es por BLOQUE (encabezado + líneas siguientes hasta el
 * próximo encabezado), igual que el CHECK 6 original: el US puede estar debajo.
 */
export function parseTasks(content) {
  const lines = (content ?? "").split(/\r?\n/);
  const headers = [];
  let tableRows = 0;
  let current = null; // bloque abierto, para detectar US-N en continuaciones

  const cerrar = () => {
    if (current) current.us = US_REF.test(current._text);
  };

  for (const line of lines) {
    const cb = line.match(CHECKBOX);
    const hd = cb ? null : line.match(HEADER);
    if (cb || hd) {
      cerrar();
      current = {
        id: cb ? cb[2] : hd[1],
        done: cb ? cb[1].toLowerCase() === "x" : null,
        us: false,
        _text: line,
      };
      headers.push(current);
      continue;
    }
    // Las filas de tabla y cualquier otra línea no abren bloque: se cuentan si
    // son tabla y, como el CHECK 6 original, se anexan al texto del bloque vigente.
    if (TABLE.test(line)) tableRows++;
    if (current) current._text += "\n" + line;
  }
  cerrar();

  const checkbox = { total: 0, done: 0 };
  for (const h of headers) {
    if (h.done === null) continue; // encabezado sin checkbox: CHECK 6 lo ve, el conteo no
    checkbox.total++;
    if (h.done) checkbox.done++;
  }

  const format = checkbox.total > 0 ? "canonico" : tableRows > 0 ? "tabla" : "ninguno";
  const sinUS = headers.filter((h) => !h.us).map((h) => h.id);

  // `_text` es interno al parseo: no sale en la vista pública.
  for (const h of headers) delete h._text;

  return { format, checkbox, tableRows, headers, sinUS };
}
