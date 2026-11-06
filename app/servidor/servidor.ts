import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { correrAgente, type Ejecutor, ejecutorClaude } from "./agentes.ts";
import { crearCarpeta, escribir, leer, listar } from "./archivos.ts";
import { type Conversacion, guardarHistorial, leerHistorial, type Progreso, progresoValido, ultimoRepo } from "./historial.ts";
import { guardarBrief, prepararRepo, type Repo, urlDeRepo } from "./repo.ts";

export type Opciones = {
  /** Carpeta donde se clonan los repos de la persona. */
  base: string;
  ejecutor?: Ejecutor;
  /** Cómo se valida el link del repo (por defecto, solo GitHub). */
  validarUrl?: (entrada: string) => Repo | null;
};

type Sesion = { repo: Repo | null; carpeta: string | null; modeloInstalado: boolean; briefSubido: boolean; corriendo: number | null; salidas: Record<number, string>; actividad: Record<number, string[]>; progreso: Progreso | null; chat: Record<number, Conversacion> };

const MAX_MENSAJE = 4000;

const LOCAL = new Set(["127.0.0.1", "localhost", "[::1]"]);
const MAX_CUERPO = 64 * 1024;

/** Solo atiende a páginas que vienen de esta misma computadora (protege de otras webs abiertas en el navegador). */
function esLocal(req: IncomingMessage): boolean {
  const host = (req.headers.host ?? "").replace(/:\d+$/, "");
  if (!LOCAL.has(host)) return false;
  const origen = req.headers.origin;
  if (!origen) return true;
  try {
    return LOCAL.has(new URL(origen).hostname);
  } catch {
    return false;
  }
}

function leerJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((ok, fallo) => {
    let tamano = 0;
    const partes: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      tamano += c.length;
      if (tamano > MAX_CUERPO) {
        fallo(new Error("El pedido es demasiado grande."));
        req.destroy();
      } else partes.push(c);
    });
    req.on("end", () => {
      try {
        const v: unknown = partes.length ? JSON.parse(Buffer.concat(partes).toString("utf8")) : {};
        ok(typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {});
      } catch {
        fallo(new Error("El pedido no es válido."));
      }
    });
    req.on("error", fallo);
  });
}

export function crearServidor(opciones: Opciones): Server {
  const ejecutor = opciones.ejecutor ?? ejecutorClaude;
  const validar = opciones.validarUrl ?? urlDeRepo;
  const s: Sesion = { repo: null, carpeta: null, modeloInstalado: false, briefSubido: false, corriendo: null, salidas: {}, actividad: {}, progreso: null, chat: {} };

  /** Guarda en disco dónde va la persona con este repo, para retomar aunque se reinicie todo. */
  const persistir = () => {
    if (s.repo) guardarHistorial(opciones.base, { url: s.repo.url, nombre: s.repo.nombre, briefSubido: s.briefSubido, salidas: s.salidas, actividad: s.actividad, progreso: s.progreso, chat: s.chat });
  };
  /** Carga la sesión de un repo desde su carpeta y su historial. */
  const retomar = (repo: Repo, carpeta: string) => {
    const h = leerHistorial(opciones.base, repo.nombre);
    Object.assign(s, {
      repo,
      carpeta,
      modeloInstalado: true,
      briefSubido: (h?.briefSubido ?? false) || existsSync(join(carpeta, "drafts", "brief.md")),
      salidas: h?.salidas ?? {},
      actividad: h?.actividad ?? {},
      progreso: h?.progreso ?? null,
      chat: h?.chat ?? {},
    });
  };
  // al encender, se retoma el último repo si su carpeta sigue ahí
  const ultimo = ultimoRepo(opciones.base);
  const guardado = ultimo ? leerHistorial(opciones.base, ultimo) : null;
  if (guardado && existsSync(join(opciones.base, guardado.nombre, ".git"))) retomar({ url: guardado.url, nombre: guardado.nombre }, join(opciones.base, guardado.nombre));

  /** Un turno de la conversación con un agente: corre, guarda lo que contestó y lo sube. */
  const turno = async (carpeta: string, indice: number, texto: string | undefined) => {
    const conversacion = (s.chat[indice] ??= { sesion: null, mensajes: [] });
    s.corriendo = indice;
    if (texto === undefined) s.actividad[indice] = [];
    try {
      const r = await correrAgente(carpeta, indice, ejecutor, {
        sesion: conversacion.sesion,
        texto,
        alActividad: (frase) => {
          const lista = (s.actividad[indice] ??= []);
          lista.push(frase);
          if (lista.length > 200) lista.shift();
        },
      });
      conversacion.sesion = r.sesion;
      conversacion.mensajes.push({ rol: "agente", texto: r.salida || "Terminé este paso." });
      s.salidas[indice] = r.salida;
      persistir();
      return r;
    } catch (e) {
      // si el primer turno falla, la conversación queda vacía y se puede volver a intentar
      if (texto === undefined) delete s.chat[indice];
      else conversacion.mensajes.pop();
      persistir();
      throw e;
    } finally {
      s.corriendo = null;
    }
  };

  const responder = (res: ServerResponse, codigo: number, cuerpo: unknown) => {
    res.writeHead(codigo, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(JSON.stringify(cuerpo));
  };
  const estado = () => ({ repo: s.repo?.url ?? null, modeloInstalado: s.modeloInstalado, briefSubido: s.briefSubido, corriendo: s.corriendo, salidas: s.salidas, actividad: s.actividad, progreso: s.progreso, chat: Object.fromEntries(Object.entries(s.chat).map(([i, c]) => [i, c.mensajes])) });

  return createServer(async (req, res) => {
    if (!esLocal(req)) return responder(res, 403, { error: "Solo se atiende desde esta computadora." });
    const ruta = (req.url ?? "").split("?")[0];
    try {
      if (req.method === "GET" && ruta === "/api/estado") return responder(res, 200, estado());

      if (req.method === "POST" && ruta === "/api/repo") {
        const { url } = await leerJson(req);
        const repo = typeof url === "string" ? validar(url) : null;
        if (!repo) return responder(res, 400, { error: "Pegá el link de un repositorio de GitHub, por ejemplo https://github.com/tu-usuario/tu-repo." });
        const carpeta = join(opciones.base, repo.nombre);
        await prepararRepo(repo.url, carpeta);
        retomar(repo, carpeta);
        persistir();
        return responder(res, 200, estado());
      }

      if (req.method === "POST" && ruta === "/api/progreso") {
        if (!s.repo) return responder(res, 409, { error: "Primero conectá un repositorio." });
        const { progreso } = await leerJson(req);
        const valido = progresoValido(progreso);
        if (!valido) return responder(res, 400, { error: "El avance no es válido." });
        s.progreso = valido;
        persistir();
        return responder(res, 200, { ok: true });
      }

      if (req.method === "POST" && ruta === "/api/brief") {
        if (!s.carpeta) return responder(res, 409, { error: "Primero conectá un repositorio." });
        const { texto } = await leerJson(req);
        await guardarBrief(s.carpeta, typeof texto === "string" ? texto : "");
        s.briefSubido = true;
        persistir();
        return responder(res, 200, estado());
      }

      if (req.method === "POST" && ruta === "/api/agente") {
        if (!s.carpeta || !s.briefSubido) return responder(res, 409, { error: "Primero conectá un repositorio y subí tu brief." });
        if (s.corriendo !== null) return responder(res, 409, { error: "Ya hay un agente trabajando." });
        const { indice } = await leerJson(req);
        if (typeof indice !== "number" || !Number.isInteger(indice)) return responder(res, 400, { error: "Falta qué agente correr." });
        // si ya empezó la conversación con este agente, no se vuelve a correr: se sigue escribiéndole
        if (s.chat[indice]?.mensajes.length) return responder(res, 200, { ...estado(), salida: s.salidas[indice] ?? "", subido: false });
        s.chat[indice] = { sesion: null, mensajes: [] };
        const r = await turno(s.carpeta, indice, undefined);
        return responder(res, 200, { ...estado(), salida: r.salida, subido: r.subido });
      }

      if (req.method === "POST" && ruta === "/api/mensaje") {
        if (!s.carpeta || !s.briefSubido) return responder(res, 409, { error: "Primero conectá un repositorio y subí tu brief." });
        if (s.corriendo !== null) return responder(res, 409, { error: "Ya hay un agente trabajando." });
        const { indice, texto } = await leerJson(req);
        if (typeof indice !== "number" || !Number.isInteger(indice) || !s.chat[indice]) return responder(res, 400, { error: "Ese agente todavía no empezó a conversar." });
        const limpio = typeof texto === "string" ? texto.trim() : "";
        if (!limpio) return responder(res, 400, { error: "Escribí tu respuesta." });
        if (limpio.length > MAX_MENSAJE) return responder(res, 400, { error: "El mensaje es demasiado largo." });
        s.chat[indice].mensajes.push({ rol: "persona", texto: limpio });
        const r = await turno(s.carpeta, indice, limpio);
        return responder(res, 200, { ...estado(), salida: r.salida, subido: r.subido });
      }

      if (ruta.startsWith("/api/archivo") || ruta === "/api/carpeta") {
        if (!s.carpeta) return responder(res, 409, { error: "Primero conectá un repositorio." });
        const consulta = new URL(req.url ?? "", "http://local").searchParams.get("ruta") ?? "";
        if (req.method === "GET" && ruta === "/api/archivos") return responder(res, 200, { ruta: consulta, entradas: listar(s.carpeta, consulta) });
        if (req.method === "GET" && ruta === "/api/archivo") return responder(res, 200, { ruta: consulta, texto: leer(s.carpeta, consulta) });
        if (req.method === "POST" && ruta === "/api/archivo") {
          const { ruta: destino, texto } = await leerJson(req);
          if (typeof destino !== "string" || typeof texto !== "string") return responder(res, 400, { error: "Faltan el nombre y el contenido del archivo." });
          await escribir(s.carpeta, destino, texto);
          return responder(res, 200, { ok: true });
        }
        if (req.method === "POST" && ruta === "/api/carpeta") {
          const { ruta: destino } = await leerJson(req);
          if (typeof destino !== "string") return responder(res, 400, { error: "Falta el nombre de la carpeta." });
          await crearCarpeta(s.carpeta, destino);
          return responder(res, 200, { ok: true });
        }
      }

      return responder(res, 404, { error: "No existe." });
    } catch (e) {
      return responder(res, 500, { error: e instanceof Error ? e.message : "Algo salió mal." });
    }
  });
}
