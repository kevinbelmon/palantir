/**
 * specs-publicables — qué specs de una feature se publican y bajo qué ruta.
 *
 * ESTADO: pieza lista, sin cablear. No hay comando ni disparo que la use
 * todavía, y el destino no está fijado. Lo que resuelve es el "qué y dónde";
 * el "cómo" ya está en `lib/transporte-git.mjs` y se le pasa esta lista tal
 * cual. Ver las decisiones abiertas al final del archivo antes de conectarla.
 *
 * Por qué el destino NO puede ser el central de estado: el documento de estado
 * excluye a propósito todo contenido —"ni una línea de spec, plan o decisión,
 * porque sale hacia un central compartido"—. Las specs son exactamente eso: el
 * contenido de negocio del cliente. Publicarlas en el mismo repo invierte esa
 * decisión y le da a cada dev con acceso el material de todos los proyectos.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { leerGit } from "./estado.mjs";

/**
 * Los cuatro artefactos que definen QUÉ se acordó construir, más el status.
 *
 * El criterio no es "todo lo que hay en la carpeta": es lo que un lector externo
 * necesita para entender el acuerdo. Quedan afuera por razones distintas —
 * `checklist.md` es juicio humano en curso, `e2e/cases.md` corre contra *esta*
 * app y no se entiende sin ella, y `jira-map.yaml` lleva identificadores de
 * tickets de un tablero interno que no tiene por qué salir del repo.
 */
export const ARTEFACTOS = ["spec.md", "constitution.md", "plan.md", "tasks.md", "feature.status.md"];

/**
 * Identidad del codebase, leída del registro. Es la misma que usa el estado:
 * si las dos rutas se derivan del mismo lugar, no pueden discrepar.
 */
export function identidad(root) {
  const p = join(root, "specs", "_registry", "features.yaml");
  if (!existsSync(p)) return { error: "no existe specs/_registry/features.yaml." };
  let meta;
  try {
    meta = YAML.parse(readFileSync(p, "utf8"))?.meta ?? {};
  } catch (e) {
    return { error: `features.yaml no es YAML válido — ${e.message}` };
  }
  // `repo` se deriva del remote git (la misma fuente que el estado), no de un
  // campo declarado: así las dos rutas de publicación no pueden discrepar.
  // `proyecto_id` sigue siendo del registro (es el PRY-nnn de Discovery).
  const git = leerGit(root);
  const repo = git ? git.path.split("/").pop() : null;
  const falta = [
    !meta.proyecto_id && "meta.proyecto_id en el registro",
    !repo && "un remote git `origin` (de ahí sale el nombre del codebase)",
  ].filter(Boolean);
  if (falta.length) {
    return { error: `falta ${falta.join(" y ")}. Sin identidad no se publica.` };
  }
  return { proyecto: String(meta.proyecto_id), repo };
}

/**
 * Prefijo bajo el que vive una feature en el repo de destino.
 *
 * Espeja la convención del estado (`estado/<proyecto>/<repo>.json`): carpeta por
 * proyecto, después por codebase, después por feature. Un producto con varios
 * codebases queda agrupado y ninguno pisa al otro.
 *
 * `proyecto` sale del registro tal como esté declarado. Si mañana se decide que
 * la clave de proyecto es el slug y no el `PRY-nnn` —lo que elimina las
 * colisiones entre contadores locales— cambia acá y en `--publish-path`, y en
 * ningún otro lado.
 */
export function prefijo({ proyecto, repo }, featureId) {
  return `specs/${proyecto}/${repo}/${featureId}`;
}

/**
 * Archivos publicables de una feature, en la forma que espera `publicar()`.
 *
 * Omite en silencio lo que no existe: una feature recién generada no tiene
 * todos los artefactos, y eso no es un error. Devuelve lista vacía si no hay
 * ninguno, y quien llame decide si eso amerita avisar.
 */
export function archivosDeFeature(root, featureId, ident) {
  const base = join(root, "specs", featureId);
  if (!existsSync(base)) return { error: `no existe specs/${featureId}.` };

  const archivos = ARTEFACTOS.map((nombre) => ({
    origen: join(base, nombre),
    rutaDestino: `${prefijo(ident, featureId)}/${nombre}`,
  })).filter((a) => existsSync(a.origen));

  return { archivos };
}

/**
 * Features candidatas: las que el registro declara y tienen carpeta.
 *
 * No filtra por estado. Publicar solo las CERRADAS o también las abiertas es
 * una decisión de producto, no del lector: ver las decisiones abiertas.
 */
export function featuresDelRepo(root) {
  const p = join(root, "specs", "_registry", "features.yaml");
  if (!existsSync(p)) return [];
  try {
    const reg = YAML.parse(readFileSync(p, "utf8")) ?? {};
    return (reg.features ?? [])
      .filter((f) => f?.id && f.type !== "fix" && existsSync(join(root, "specs", f.id)))
      .map((f) => ({ id: f.id, status: f.status ?? null }));
  } catch {
    return [];
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * DECISIONES ABIERTAS — resolver antes de cablear esto a un comando
 *
 * 1. ¿A qué repo? No al central de estado, por lo dicho arriba. Falta definir
 *    cuál, y si es uno por cliente o uno compartido con permisos por carpeta
 *    (que git no tiene: ver el problema de colaboradores del central).
 *
 * 2. ¿Cuándo se publica? Generar es barato y se regenera seguido; publicar en
 *    cada iteración de `/sdd-generate` llena el repo de ruido. La alternativa
 *    es publicar al cerrar la feature, que da menos ruido y más latencia.
 *
 * 3. ¿Qué guarda usa? La del estado compara `source.repo` DENTRO del JSON. Un
 *    markdown no tiene dónde declarar de quién es, así que dos codebases con el
 *    mismo `meta.repo` se pisarían las specs sin que nada lo note. Si hace falta
 *    guarda, hay que publicar junto a los artefactos un archivo de identidad
 *    contra el cual comparar.
 *
 * 4. ¿Qué pasa cuando una feature se borra o se renombra? El transporte copia y
 *    commitea; no borra. Las specs de una feature eliminada quedarían huérfanas
 *    en el destino para siempre.
 * ──────────────────────────────────────────────────────────────────────────── */
