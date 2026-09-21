/**
 * transporte-http — publica el estado a un endpoint en vez de a un repo git.
 *
 * Espejo de `transporte-git.mjs`: mismo contrato de retorno, otro mecanismo.
 * La eleccion no se adivina de la forma de la URL —`https://host/org/repo.git`
 * es una URL de clonado y `https://host/estado` es un endpoint, y distinguirlas
 * por heuristica falla el dia que alguien monte el endpoint bajo una ruta que
 * parezca un repo—. Se declara: `--endpoint` o `SDD_ESTADO_ENDPOINT`.
 *
 * Cero dependencias: `fetch` viene en Node.
 *
 * Dos respuestas del servidor que NO son fallo:
 *   409  ya hay algo mas nuevo publicado. Reintentarlo seria un bucle.
 *   304  nada cambio.
 *
 * Y una que si lo es pero no se pierde: sin red, el estado sigue en
 * `metrics/estado.json` y se reenvia cuando haya. Publicar es observabilidad,
 * no un gate.
 */

import { readFileSync } from "node:fs";

/** Nunca se imprime la credencial: un token en un log es un token filtrado. */
const ocultar = (t) => (t ? `${t.slice(0, 4)}…(${t.length})` : "sin token");

/**
 * @param {object}   o
 * @param {string}   o.destino    URL del endpoint.
 * @param {string}   o.archivo    Ruta local del JSON a publicar.
 * @param {string}  [o.token]     Bearer.
 * @param {string}  [o.rutaDestino] Se manda como cabecera, para que el receptor
 *                                pueda rutear o versionar sin parsear el cuerpo.
 * @param {boolean} [o.dryRun]
 * @param {number}  [o.timeoutMs]
 * @returns {Promise<{estado:"publicado"|"sin-cambios"|"dry-run"|"error", detalle:string[]}>}
 */
export async function publicar({
  destino,
  archivo,
  token = "",
  rutaDestino = "",
  dryRun = false,
  timeoutMs = 15000,
}) {
  if (!destino) return { estado: "error", detalle: ["falta el endpoint de destino."] };

  let cuerpo;
  try {
    cuerpo = readFileSync(archivo, "utf8");
  } catch (e) {
    return { estado: "error", detalle: [`no se pudo leer ${archivo}`, e.message] };
  }

  let objeto;
  try {
    objeto = JSON.parse(cuerpo);
  } catch {
    return { estado: "error", detalle: [`${archivo} no es JSON valido — no se publica algo que el receptor no va a poder leer.`] };
  }

  if (dryRun) {
    return {
      estado: "dry-run",
      detalle: [`POST ${destino}  [${ocultar(token)}]  ${cuerpo.length} bytes`],
    };
  }

  try {
    const r = await fetch(destino, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-estado-schema": String(objeto.schema_version ?? ""),
        ...(rutaDestino ? { "x-estado-ruta": rutaDestino } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const texto = await r.text().catch(() => "");

    if (r.status === 409 || r.status === 304) {
      return { estado: "sin-cambios", detalle: ["el destino ya tiene algo igual o mas nuevo."] };
    }
    if (!r.ok) {
      return { estado: "error", detalle: [`el endpoint respondio HTTP ${r.status}.`, texto.slice(0, 300)] };
    }
    return { estado: "publicado", detalle: [`HTTP ${r.status}`, texto.slice(0, 200)].filter(Boolean) };
  } catch (e) {
    const causa = e.name === "TimeoutError" ? `no respondio en ${timeoutMs}ms` : e.message;
    return {
      estado: "error",
      detalle: [
        `no se pudo contactar el endpoint: ${causa}.`,
        "No se perdio nada: el estado quedo en metrics/estado.json y se puede reenviar.",
      ],
    };
  }
}
