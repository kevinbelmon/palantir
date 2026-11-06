import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { join } from "node:path";
import { correrAgente, type Ejecutor, ejecutorClaude } from "./agentes.ts";
import { crearCarpeta, escribir, leer, listar } from "./archivos.ts";
import { guardarBrief, prepararRepo, type Repo, urlDeRepo } from "./repo.ts";

export type Opciones = {
  /** Carpeta donde se clonan los repos de la persona. */
  base: string;
  ejecutor?: Ejecutor;
  /** Cómo se valida el link del repo (por defecto, solo GitHub). */
  validarUrl?: (entrada: string) => Repo | null;
};

type Sesion = { repo: Repo | null; carpeta: string | null; modeloInstalado: boolean; briefSubido: boolean; corriendo: number | null; salidas: Record<number, string>; actividad: Record<number, string[]> };

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
  const s: Sesion = { repo: null, carpeta: null, modeloInstalado: false, briefSubido: false, corriendo: null, salidas: {}, actividad: {} };

  const responder = (res: ServerResponse, codigo: number, cuerpo: unknown) => {
    res.writeHead(codigo, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(JSON.stringify(cuerpo));
  };
  const estado = () => ({ repo: s.repo?.url ?? null, modeloInstalado: s.modeloInstalado, briefSubido: s.briefSubido, corriendo: s.corriendo, salidas: s.salidas, actividad: s.actividad });

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
        Object.assign(s, { repo, carpeta, modeloInstalado: true, briefSubido: false, salidas: {}, actividad: {} });
        return responder(res, 200, estado());
      }

      if (req.method === "POST" && ruta === "/api/brief") {
        if (!s.carpeta) return responder(res, 409, { error: "Primero conectá un repositorio." });
        const { texto } = await leerJson(req);
        await guardarBrief(s.carpeta, typeof texto === "string" ? texto : "");
        s.briefSubido = true;
        return responder(res, 200, estado());
      }

      if (req.method === "POST" && ruta === "/api/agente") {
        if (!s.carpeta || !s.briefSubido) return responder(res, 409, { error: "Primero conectá un repositorio y subí tu brief." });
        if (s.corriendo !== null) return responder(res, 409, { error: "Ya hay un agente trabajando." });
        const { indice } = await leerJson(req);
        if (typeof indice !== "number" || !Number.isInteger(indice)) return responder(res, 400, { error: "Falta qué agente correr." });
        s.corriendo = indice;
        s.actividad[indice] = [];
        try {
          const r = await correrAgente(s.carpeta, indice, ejecutor, (frase) => {
            const lista = (s.actividad[indice] ??= []);
            lista.push(frase);
            if (lista.length > 200) lista.shift();
          });
          s.salidas[indice] = r.salida;
          return responder(res, 200, { ...estado(), salida: r.salida, subido: r.subido });
        } finally {
          s.corriendo = null;
        }
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
