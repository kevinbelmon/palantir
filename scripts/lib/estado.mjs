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
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import YAML from "yaml";
import { parseTasks } from "./tasks.mjs";

/**
 * Descompone la URL de un remote git en `{ host, path }`, o null si no parece una.
 *
 * Seguridad: el host NUNCA lleva usuario ni token. Un remote https puede venir
 * como `https://oauth2:<token>@host/...` o `https://x-access-token:<token>@host/...`,
 * y este objeto se publica fuera del repo: dejar pasar esa credencial sería
 * filtrarla al tablero. `new URL()` separa el userinfo del hostname por nosotros;
 * para la forma SSH scp (`git@host:grupo/repo.git`) se descarta el `user@` a mano.
 *
 * `path` va sin `.git` y sin barras de borde. No fija host: sirve igual para
 * GitLab, GitHub o cualquier otro.
 */
export function parseGitRemote(url) {
  if (!url) return null;
  url = String(url).trim();
  let host, path;

  if (url.includes("://")) {
    // https:// · http:// · ssh:// — URL() descarta el userinfo del hostname.
    let u;
    try {
      u = new URL(url);
    } catch {
      return null;
    }
    host = u.hostname; // sin usuario, sin token, sin puerto
    path = u.pathname;
  } else {
    // Forma SSH scp: `[user@]host:grupo/repo.git`. El `user@` se descarta.
    const m = url.match(/^(?:[^@/]+@)?([^:/]+):(.+)$/);
    if (!m) return null;
    host = m[1];
    path = m[2];
  }

  host = host.replace(/\/+$/, "");
  path = path.replace(/^\/+/, "").replace(/\.git$/i, "").replace(/\/+$/, "");
  if (!host || !path) return null;
  return { host, path };
}

/**
 * Ubicación del codebase en su repo git: `{ host, path, subdir }`, o null.
 *
 * Es la única parte del módulo que ejecuta un subproceso. Lee config local (no
 * sale a la red) y es best-effort: cualquier fallo —no es un repo, no hay remote
 * origin, git no está— devuelve null, igual que `meta.repo` cuando falta.
 *
 * `subdir` sale de `git rev-parse --show-prefix`: vacío si el codebase está en la
 * raíz del repo, con valor si es un monorepo. `meta.repo` no se toca: esto es un
 * dato aparte (dónde vive) de la identidad que declara el equipo (qué es).
 */
function leerGit(root) {
  const git = (args) => {
    try {
      return execFileSync("git", args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return null;
    }
  };
  const url = git(["remote", "get-url", "origin"]);
  const parsed = parseGitRemote(url);
  if (!parsed) return null;
  const prefix = git(["rev-parse", "--show-prefix"]) ?? "";
  return { host: parsed.host, path: parsed.path, subdir: prefix.replace(/\/+$/, "") };
}

/** Versión del formato del objeto. Sube si cambia la forma, no el contenido. */
export const SCHEMA_VERSION = 3;

/** No se pudo determinar. Distinto de "no pasó". */
export const SIN_DATO = "SIN_DATO";

// El parseo de tasks.md vive en lib/tasks.mjs — una sola definición que comparten
// este archivo y el auditor, para que no vuelvan a divergir.

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
export function ultimoBloque(contenido, tipo) {
  const all = bloques(contenido, tipo);
  return all.length ? all[all.length - 1] : null;
}

/** Valor de `- campo: valor` dentro del cuerpo de un bloque. */
export function campo(cuerpo, nombre) {
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

  const { format, checkbox, tableRows } = parseTasks(txt);
  if (format === "canonico") return { total: checkbox.total, hechas: checkbox.done, formato: "canonico" };
  // El formato de tabla reporta el total pero no cuántas están hechas: usa emojis
  // de estado que no son contrato de nada. Inventar un número sería peor que null.
  if (format === "tabla") return { total: tableRows, hechas: null, formato: "tabla" };
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

// ---------- salud ----------

/**
 * Veredicto del auditor, si dejó uno escrito (`sdd-audit --json`).
 *
 * Leerlo no es validar: el veredicto ya lo dio el auditor y acá solo se
 * transporta. Sin esto, en un tablero que junta varios codebases uno con FAIL
 * se ve igual de sano que uno en verde, y nadie tiene forma de notarlo.
 *
 * `null` cuando el auditor nunca corrió con `--json` en este árbol. Es distinto
 * de "pasó": un repo sin veredicto no es un repo sano, es uno sin medir, y el
 * tablero tiene que poder mostrar esa diferencia.
 */
function leerAudit(root) {
  const txt = leerTexto(root, "metrics/audit-result.json");
  if (txt === null) return null;
  try {
    const a = JSON.parse(txt);
    return {
      fail: a.fail ?? null,
      warn: a.warn ?? null,
      ok: a.ok ?? null,
      // La fecha va incluida a propósito: un veredicto viejo sobre un repo que
      // siguió cambiando no dice lo mismo que uno recién corrido, y quien lea
      // el tablero tiene que poder distinguirlo.
      generated: a.generated ?? null,
    };
  } catch {
    return null;
  }
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
// ---------- esfuerzo ----------

/**
 * Esfuerzo de una feature, leido del bloque `### Reporte de Esfuerzo SDD`.
 *
 * Dos cautelas que definen la forma de esto:
 *
 * 1. **Solo se transporta lo medido.** De los seis DX_MET, unicamente el token
 *    budget de la Variante A es observado: sale del bloque `usage` que devuelve
 *    Anthropic, leido por ccusage. Los ciclos de autocorreccion y las
 *    interacciones los escribe el agente sobre si mismo, de memoria, y publicar
 *    un recuerdo al lado de una medicion los vuelve indistinguibles. Por eso
 *    `ciclos` viaja con su origen declarado y nunca se suma a nivel proyecto.
 *
 * 2. **El metodo viaja con el numero.** La Variante A son tokens reales; la B es
 *    `bytes / 4`, una estimacion de lo leido que ni siquiera mide lo mismo. Dos
 *    features medidas distinto no se pueden sumar, asi que el agregado declara su
 *    metodo y se niega a mezclar: si hay mas de uno, reporta MIXTO y no totaliza.
 */
function leerEsfuerzo(root, id, medido) {
  const txt = leerTexto(root, `metrics/${id}-metrics.md`);
  const vacio = { tokens: SIN_DATO, metodo: SIN_DATO, ciclos: SIN_DATO, ciclos_origen: "autorreporte" };
  if (txt === null) return vacio;

  // El reporte es un encabezado de nivel 3, no de 2: `bloques()` busca `## ` y no
  // lo encuentra. Se localiza aparte y se corta en el proximo encabezado de
  // cualquier nivel, que es lo que lo cierra en el archivo real.
  const encabezados = [...txt.matchAll(/^#{2,3}[ 	]+.*$/gim)];
  const idx = encabezados.map((m, i) => [m, i]).filter(([m]) => /Reporte de Esfuerzo SDD/i.test(m[0])).pop();
  if (!idx) return vacio;
  const [m, i] = idx;
  const desde = m.index + m[0].length;
  const hasta = encabezados[i + 1] ? encabezados[i + 1].index : txt.length;
  const cuerpo = txt.slice(desde, hasta);

  // ccusage escribe `source: ccusage`; la variante B no lo declara.
  const fuente = campo(cuerpo, "source");
  const metodo = fuente && /ccusage/i.test(fuente) ? "ccusage" : /bytes\s*÷\s*4|bytes\s*\/\s*4|Variante B/i.test(cuerpo) ? "estimado" : SIN_DATO;

  // El total puede venir como `TOTAL: n`, como `totalTokens: n`, o como la fila
  // TOTAL de una tabla. El ancho de esa tabla no esta fijado: ccusage se reporta
  // en dos columnas y la variante estimada en tres, asi que no se cuenta
  // columnas — se toma la ultima celda numerica de la fila.
  const filaTotal = cuerpo.match(/^[ 	]*\|.*\*{0,2}TOTAL\*{0,2}.*$/im)?.[0] ?? null;
  const ultimaCelda = filaTotal
    ? (filaTotal.split("|").map((c) => c.trim()).filter((c) => /^[\d.,]+$/.test(c)).pop() ?? null)
    : null;

  const total =
    entero(campo(cuerpo, "TOTAL")) ??
    entero(campo(cuerpo, "totalTokens")) ??
    entero(ultimaCelda);

  const ciclos = entero(cuerpo.match(/DX_MET_001[^:]*:\s*\**\s*(\d+)/i)?.[1] ?? null);

  // Lo medido gana sobre lo narrado. El reporte lo escribe el agente de memoria;
  // `medido` viene de ccusage atribuido por session_ids, que es observacion.
  // El desglose viaja porque el total engana: en una sesion larga `cache_read`
  // —el contexto releido en cada request— pasa del 95% y se factura a una
  // fraccion del precio de entrada. Sumar los cuatro en un solo numero mezcla
  // magnitudes con economias distintas, y el resultado queda dominado por la mas
  // barata. `output` + `cache_creation` es mucho mejor proxy del trabajo real.
  return {
    tokens: medido ? medido.tokens : (total ?? SIN_DATO),
    desglose: medido?.desglose ?? SIN_DATO,
    metodo: medido ? "ccusage" : (total === null ? SIN_DATO : metodo),
    ciclos: ciclos ?? SIN_DATO,
    ciclos_origen: "autorreporte",
  };
}

/**
 * Consumo de tokens del proyecto, medido por `sdd-tokens` con ccusage.
 *
 * Es un total de PROYECTO: ccusage reporta por sesion y atribuir sesiones a
 * features necesita el mapeo del hook (`metrics/sessions.jsonl`). Se transporta
 * con su `alcance` declarado para que nadie lo compare contra una suma por
 * feature, que es otra magnitud.
 */
function leerTokensProyecto(root) {
  const txt = leerTexto(root, "metrics/tokens.json");
  if (txt === null) return null;
  try {
    const t = JSON.parse(txt);
    const total = Number(t?.tokens?.total);
    if (!Number.isFinite(total)) return null;
    return {
      tokens: total,
      metodo: t.source ?? "ccusage",
      alcance: t.alcance ?? "proyecto",
      medido: t.generated ?? null,
      desglose: t.tokens ?? null,
      porFeature: t.features ?? {},
    };
  } catch {
    return null;
  }
}

/**
 * Agregado de esfuerzo del proyecto.
 *
 * Suma solo features medidas con el MISMO metodo. Con metodos mezclados el total
 * seria la suma de tokens reales y de una estimacion de bytes leidos: dos cosas
 * distintas bajo un mismo numero. En ese caso se reporta MIXTO sin total, que es
 * la version honesta de "no se puede responder con lo que hay".
 */
function agregarEsfuerzo(features, proyecto) {
  const medidas = features.filter((f) => typeof f.esfuerzo.tokens === "number");

  // Sin mediciones por feature se usa el total del proyecto, que es lo que hoy
  // puede medirse sin el hook de sesiones. Viaja con `alcance` para que el
  // consumidor sepa que no es una suma de features.
  if (!medidas.length) {
    if (proyecto) {
      const { porFeature, ...p } = proyecto;
      return { ...p, features_medidas: 0, features_totales: features.length };
    }
    return { tokens: SIN_DATO, metodo: SIN_DATO, alcance: SIN_DATO, features_medidas: 0, features_totales: features.length };
  }
  const metodos = [...new Set(medidas.map((f) => f.esfuerzo.metodo))];
  if (metodos.length > 1) {
    return { tokens: SIN_DATO, metodo: "MIXTO", alcance: "features", features_medidas: medidas.length, features_totales: features.length };
  }
  return {
    tokens: medidas.reduce((a, f) => a + f.esfuerzo.tokens, 0),
    metodo: metodos[0],
    alcance: "features",
    // La suma por feature no incluye lo que no se pudo atribuir. Sin el total del
    // proyecto al lado, un tablero mostraria menos consumo del real.
    total_proyecto: proyecto?.tokens ?? SIN_DATO,
    desglose_proyecto: proyecto?.desglose ?? SIN_DATO,
    features_medidas: medidas.length,
    features_totales: features.length,
  };
}

export function leerEstado(root, { framework = null } = {}) {
  const reg = leerYaml(root, "specs/_registry/features.yaml", null);
  const hayRegistro = reg !== null;
  const crudas = (reg?.features ?? []).filter(Boolean);

  const tokensProyecto = leerTokensProyecto(root);

  const features = crudas.map((f) => {
    const tasks = contarTasks(root, f.id);
    const statusTxt = leerTexto(root, `specs/${f.id}/feature.status.md`);
    const lastCommand = statusTxt?.match(/last_command:\s*(.+)/)?.[1]?.trim() ?? null;

    const fases = leerFases(root, f.id, tasks);
    const declarado = f.status ?? SIN_DATO;
    // Un cierre vale SOLO con evidencia: el bloque `## Review: APROBADO` que
    // escribe /sdd-review —el mismo criterio que usa el gate de cierre del
    // auditor (sdd-audit CHECK 3)—. Sin esa prueba, un `status: CLOSED` del
    // registro es una autodeclaración y NO se publica como cerrado: cae a su
    // fase real para que ningún tablero lo cuente como hecho. Publicar el claim
    // crudo dejaría salir una feature "terminada" que nunca se implementó.
    const cierreSinEvidencia = declarado === "CLOSED" && fases.review !== "APROBADO";
    const statusPublicado = cierreSinEvidencia ? "OPEN" : declarado;

    return {
      id: f.id,
      type: f.type ?? "feature",
      // Derivado de la evidencia, no copiado del registro. Es la única fuente
      // de "hecho": si dice CLOSED, hay `## Review: APROBADO` que lo respalda.
      status: statusPublicado,
      // Lo que el registro declara, intacto, solo para trazar el intento.
      // Nunca es fuente de "hecho".
      status_declarado: declarado,
      cierre_sin_evidencia: cierreSinEvidencia,
      cierre_motivo: cierreSinEvidencia
        ? "declarada CLOSED sin `## Review: APROBADO` en métricas — cierre no verificado"
        : null,
      domain: f.domain ?? null,
      owner: f.owner ?? null,
      sprint: f.sprint ?? null,
      created: f.created ?? null,
      // La fecha de cierre tampoco viaja si el cierre no está verificado: una
      // feature republicada como OPEN no puede exhibir un "Cerrado: <fecha>".
      closed: cierreSinEvidencia ? null : (f.closed ?? null),
      discovery_id: f.discovery_id ?? null,
      epic: f.epic ?? null,
      release: f.release ?? null,
      size: f.size ?? null,
      tareas: tasks,
      fases,
      esfuerzo: leerEsfuerzo(root, f.id, tokensProyecto?.porFeature?.[f.id] ?? null),
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
      // Dónde vive el codebase (host/path/subdir del remote), para el panel
      // Ambientes. Aparte de meta.repo, que es la identidad autodeclarada.
      git: leerGit(root),
    },
    resumen: {
      features: features.length,
      open: cuenta("OPEN"),
      // `closed` ya es solo cierres verificados: `status` se derivó de la
      // evidencia, así que una CLOSED sin review APROBADO cuenta en `open`, no
      // acá. Las declaradas cerradas sin prueba viajan aparte, para que se vean
      // sin contarse como hechas.
      closed: cuenta("CLOSED"),
      closed_sin_verificar: features.filter((f) => f.cierre_sin_evidencia).length,
      blocked: cuenta("BLOCKED"),
      tareas: {
        total: suma((f) => f.tareas.total),
        hechas: suma((f) => f.tareas.hechas),
        features_sin_contar: features.length - contables.length,
      },
      esfuerzo: agregarEsfuerzo(features, tokensProyecto),
    },
    audit: leerAudit(root),
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
    features: estado.features.map(({ touches, ...f }) => ({
      ...f,
      // Se renombra al publicar. `touches` es el vocabulario del registro, donde
      // significa "rutas que la feature declara que va a crear o modificar". En
      // un tablero, al lado de "tareas 0/7", ese nombre se lee como archivos ya
      // tocados: parece una feature con siete archivos en juego cuando puede no
      // existir ninguno todavía. El número es el mismo; el nombre no engaña.
      archivos_declarados: touches.length,
    })),
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
  if (!estado.source.git)
    out.push("sin remote git `origin` (o el codebase no es un repo) — el panel Ambientes no sabrá dónde vive");

  if (!estado.audit)
    out.push(
      "sin veredicto del auditor — corré `node scripts/sdd-audit.mjs --json` para que el " +
        "documento pueda decir si este repo pasa sus propios checks"
    );
  else if (estado.audit.fail > 0)
    out.push(`el auditor reporta ${estado.audit.fail} FAIL en este repo`);

  const sinEvidencia = estado.features.filter((f) => f.cierre_sin_evidencia);
  if (sinEvidencia.length)
    out.push(
      `${sinEvidencia.length} feature(s) marcadas CLOSED sin evidencia de review APROBADO — ` +
        `no se publican como hechas (${sinEvidencia.map((f) => f.id).join(", ")})`
    );

  const tabla = estado.features.filter((f) => f.tareas.formato === "tabla");
  if (tabla.length)
    out.push(
      `${tabla.length} feature(s) con tasks.md en formato de tabla: el auditor no las cuenta ` +
        `y el avance sale incompleto (${tabla.map((f) => f.id).join(", ")})`
    );

  return out;
}
