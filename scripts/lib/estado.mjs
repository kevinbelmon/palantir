/**
 * estado.mjs — lee el estado de un DATA_ROOT y lo devuelve como objeto.
 *
 * Un solo lugar donde se define "en qué estado está este proyecto", para que el
 * tablero y el documento publicado no puedan contradecirse. Lo usan
 * gen-kanban.mjs (lo dibuja) y sdd-state.mjs (lo escribe como JSON).
 *
 * Los patrones de parseo son los MISMOS que usa scripts/sdd-audit.mjs. Si acá
 * se contaran las tasks distinto, el tablero y el auditor darían números
 * distintos del mismo repo — que es exactamente el bug que este módulo cierra.
 *
 * Qué NO lee, a propósito: spec.md, plan.md, constitution.md, DECISIONS.md y
 * graph/domain.yaml. Este objeto se publica fuera del repo, así que el módulo
 * no abre ningún archivo con contenido del cliente. No es una convención: es
 * que las rutas no están en el código.
 *
 * Regla de honestidad: lo que no se pudo leer se reporta SIN_DATO, nunca 0 ni
 * false. Un dato ausente y un dato en cero llevan a decisiones distintas.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

/** Versión del formato del objeto. Sube si cambia la forma, no el contenido. */
export const SCHEMA_VERSION = 1;

/** No se pudo determinar. Distinto de "no pasó". */
export const SIN_DATO = "SIN_DATO";

/**
 * Task canónica: `- [ ] T001` / `- [x] T001`.
 * Idéntico a taskCounts() de sdd-audit.mjs. Es lo que escribe /sdd-implement.
 */
const RE_TASK = /^[ \t]*[-*][ \t]*\[([ xX])\][ \t]*T\d{3}/;

/**
 * Formato de tabla `| T01 | … | ✅ |`, el del fixture demo/. No es el canónico
 * y el auditor no lo cuenta. Se detecta solo para poder decir que está, en vez
 * de reportar cero tasks y que parezca una feature sin trabajo.
 */
const RE_TASK_TABLA = /^[ \t]*\|[ \t]*T\d+[ \t]*\|/;

// ---------- lectura ----------

const leerTexto = (root, rel) => {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
};

const leerYaml = (root, rel, fallback) => {
  const txt = leerTexto(root, rel);
  if (txt === null) return fallback;
  try {
    return YAML.parse(txt) ?? fallback;
  } catch {
    return fallback;
  }
};

/**
 * Bloques `## Tipo …` de un archivo de métricas, en orden de aparición.
 * Un bloque termina donde empieza el próximo heading de nivel 2 (`###` no corta).
 * Copiado de sdd-audit.mjs: los dos tienen que ver los mismos bloques.
 */
function bloques(contenido, tipo) {
  const re = new RegExp(`^##[ \\t]+${tipo}\\b.*$`, "gim");
  const inicios = [];
  let m;
  while ((m = re.exec(contenido)) !== null) inicios.push(m.index);
  return inicios.map((start) => {
    const next = contenido.indexOf("\n## ", start + 1);
    return contenido.slice(start, next === -1 ? contenido.length : next);
  });
}

/** El último bloque de un tipo, que es el que vale. */
function ultimoBloque(contenido, tipo) {
  const all = bloques(contenido, tipo);
  return all.length ? all[all.length - 1] : null;
}

/** Valor de `- campo: valor` dentro del cuerpo de un bloque. */
function campo(cuerpo, nombre) {
  const m = cuerpo.match(
    new RegExp(`^[ \\t]*[-*]?[ \\t]*${nombre}[ \\t]*:[ \\t]*(.+)$`, "im")
  );
  return m ? m[1].trim() : null;
}

const entero = (v) => {
  if (v === null) return null;
  const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(n) ? null : n;
};

// ---------- tasks ----------

/**
 * Cuenta las tasks de una feature.
 *
 * `formato` dice qué encontró:
 *   canonico    checkboxes `- [ ] T001` — lo que produce /sdd-implement
 *   tabla       filas `| T01 | … |` — fixture legacy, el auditor no las cuenta
 *   ninguno     hay tasks.md pero sin líneas reconocibles
 *   sin-archivo no hay tasks.md
 */
function contarTasks(root, id) {
  const txt = leerTexto(root, `specs/${id}/tasks.md`);
  if (txt === null) return { total: 0, hechas: 0, formato: "sin-archivo" };

  let total = 0;
  let hechas = 0;
  let filasTabla = 0;

  for (const linea of txt.split(/\r?\n/)) {
    const m = linea.match(RE_TASK);
    if (m) {
      total++;
      if (m[1].toLowerCase() === "x") hechas++;
      continue;
    }
    if (RE_TASK_TABLA.test(linea)) filasTabla++;
  }

  if (total > 0) return { total, hechas, formato: "canonico" };
  if (filasTabla > 0) {
    // Se reporta el total pero no cuántas están hechas: el formato de tabla usa
    // emojis de estado que no son contrato de nada. Inventar un número acá sería
    // peor que decir que no se sabe.
    return { total: filasTabla, hechas: null, formato: "tabla" };
  }
  return { total: 0, hechas: 0, formato: "ninguno" };
}

// ---------- fases ----------

/**
 * Estado de las cuatro fases, leído de metrics/<id>-metrics.md.
 *
 * El bloque `## Implement` solo se escribe cuando la implementación cerró
 * completa —/sdd-implement lo prohíbe explícitamente si algún test falla—, así
 * que su presencia ya significa PASS. Que falte no significa que falló:
 * significa que todavía no cerró.
 */
function leerFases(root, id, tasks) {
  const txt = leerTexto(root, `metrics/${id}-metrics.md`);
  const fases = {
    validate: SIN_DATO,
    implement: SIN_DATO,
    e2e: SIN_DATO,
    review: SIN_DATO,
  };
  if (txt === null) {
    if (tasks.hechas > 0) fases.implement = "EN_CURSO";
    return fases;
  }

  if (ultimoBloque(txt, "Validate")) fases.validate = "OK";

  if (ultimoBloque(txt, "Implement")) fases.implement = "PASS";
  else if (tasks.hechas > 0) fases.implement = "EN_CURSO";

  const e2e = ultimoBloque(txt, "E2E");
  if (e2e) {
    const failed = entero(campo(e2e, "failed"));
    fases.e2e = failed === null ? SIN_DATO : failed === 0 ? "PASS" : "FAIL";
  }

  const review = ultimoBloque(txt, "Review");
  if (review) {
    const r = campo(review, "resultado");
    fases.review = r === null ? SIN_DATO : /APROBADO/i.test(r) ? "APROBADO" : r;
  }

  return fases;
}

// ---------- sprints ----------

/**
 * Sprints declarados.
 *
 * El formato canónico es el de specs/_registry/sprints/_template.yaml, que es
 * el que lee el CHECK 5 del auditor: `sprint` escalar con el id, y `scope` como
 * lista de `{ feature: … }`.
 *
 * El fixture demo/ usa otra forma —`sprint` como mapa con `id` y `features`—
 * que el auditor no entiende. Se acepta para no reportar cero sprints donde hay
 * dos, pero se marca: un sprint que el auditor no lee no participa de sus gates.
 */
function leerSprints(root) {
  const dir = join(root, "specs/_registry/sprints");
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f) && !f.startsWith("_"))
    .map((f) => {
      const y = leerYaml(root, `specs/_registry/sprints/${f}`, null);
      const archivo = f.replace(/\.ya?ml$/, "");
      if (!y) return { id: archivo, formato: "ilegible", features: [] };

      // Canónico: sprint escalar + scope: [{ feature }]
      if (y.sprint && typeof y.sprint !== "object") {
        return {
          id: String(y.sprint),
          start: y.start ?? null,
          end: y.end ?? null,
          goal: y.goal ?? null,
          features: (y.scope ?? []).map((s) => s?.feature).filter(Boolean),
          formato: "canonico",
        };
      }

      // Legacy: sprint como mapa anidado (fixture demo/)
      const s = y.sprint ?? {};
      return {
        id: String(s.id ?? archivo),
        start: s.start ?? null,
        end: s.end ?? null,
        goal: s.goal ?? null,
        features: Array.isArray(s.features) ? s.features : [],
        formato: "anidado",
      };
    })
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

// ---------- API ----------

/**
 * Lee el DATA_ROOT y devuelve su estado.
 *
 * Nunca lanza por ausencia: un repo recién instalado, sin registro todavía,
 * devuelve un estado válido con cero features. Eso permite distinguir "sin
 * actividad" de "no reporta", que en un tablero son cosas muy distintas.
 */
export function leerEstado(root, { framework = null } = {}) {
  const reg = leerYaml(root, "specs/_registry/features.yaml", null);
  const hayRegistro = reg !== null;
  const crudas = (reg?.features ?? []).filter(Boolean);

  const features = crudas.map((f) => {
    const tasks = contarTasks(root, f.id);
    const status = leerTexto(root, `specs/${f.id}/feature.status.md`);
    const lastCommand = status?.match(/last_command:\s*(.+)/)?.[1]?.trim() ?? null;

    return {
      id: f.id,
      type: f.type ?? "feature",
      status: f.status ?? SIN_DATO,
      domain: f.domain ?? null,
      owner: f.owner ?? null,
      sprint: f.sprint ?? null,
      created: f.created ?? null,
      closed: f.closed ?? null,
      discovery_id: f.discovery_id ?? null,
      epic: f.epic ?? null,
      release: f.release ?? null,
      size: f.size ?? null,
      tareas: tasks,
      fases: leerFases(root, f.id, tasks),
      last_command: lastCommand,
      // Lista completa: el tablero local la dibuja. `paraPublicar` la reduce a
      // un número antes de que el objeto salga del repo.
      touches: Array.isArray(f.touches) ? f.touches : [],
    };
  });

  const cuenta = (s) => features.filter((f) => f.status === s).length;

  // El total agregado suma SOLO las features con formato canónico. Mezclar las
  // que no se pueden contar daría un "0 de 8" que se lee como "nada hecho"
  // cuando en realidad es "no se sabe" — la misma confusión que SIN_DATO evita
  // en las fases.
  const contables = features.filter((f) => f.tareas.formato === "canonico");
  const suma = (sel) => contables.reduce((a, f) => a + sel(f), 0);

  return {
    schema_version: SCHEMA_VERSION,
    generated: new Date().toISOString(),
    framework,
    source: {
      repo: reg?.meta?.repo ?? null,
      proyecto_id: reg?.meta?.proyecto_id ?? null,
      registro: hayRegistro,
    },
    resumen: {
      features: features.length,
      open: cuenta("OPEN"),
      closed: cuenta("CLOSED"),
      blocked: cuenta("BLOCKED"),
      tareas: {
        total: suma((f) => f.tareas.total),
        hechas: suma((f) => f.tareas.hechas),
        features_sin_contar: features.length - contables.length,
      },
    },
    sprints: leerSprints(root),
    features,
  };
}

/**
 * Reduce el estado a lo que puede salir del repo.
 *
 * El objeto completo lleva las rutas de los archivos que toca cada feature, que
 * el tablero local dibuja. Publicadas en un repo central junto al estado de
 * varios clientes, esas rutas describen la arquitectura de cada uno sin aportar
 * nada al seguimiento: para saber cuánto se movió una feature alcanza el número.
 *
 * La reducción vive acá y no en el escritor a propósito: qué información puede
 * cruzar el borde del repo es una decisión del modelo, y tiene que poder leerse
 * en un solo lugar en vez de estar implícita en quien publica.
 */
export function paraPublicar(estado) {
  return {
    ...estado,
    features: estado.features.map((f) => ({ ...f, touches: f.touches.length })),
  };
}

/**
 * Avisos sobre el estado leído. No son errores: el objeto es válido igual.
 * Existen para que quien lo publica sepa por qué un campo salió nulo, en vez
 * de descubrirlo mirando un tablero incompleto.
 */
export function avisos(estado) {
  const out = [];
  if (!estado.source.registro)
    out.push("no hay specs/_registry/features.yaml — el repo no corrió el modelo todavía");
  if (!estado.source.repo)
    out.push("falta meta.repo en el registro — el documento sale sin identidad de codebase");
  if (!estado.source.proyecto_id)
    out.push("falta meta.proyecto_id en el registro — no se puede agrupar por proyecto");

  const tabla = estado.features.filter((f) => f.tareas.formato === "tabla");
  if (tabla.length)
    out.push(
      `${tabla.length} feature(s) con tasks.md en formato de tabla: el auditor no las cuenta ` +
        `y el avance sale incompleto (${tabla.map((f) => f.id).join(", ")})`
    );

  return out;
}
