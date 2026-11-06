import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";
import { BRIEF_EJEMPLO, mensajeGuia, oracionMasLarga, palabrasTecnicas, textosDe } from "../src/contenido";
import { AGENTES, ESTADO_INICIAL, reducir, type Estado } from "../src/flujo";
import { PanelAgente } from "../src/ui/PanelAgente";
import { PantallaFinal } from "../src/ui/PantallaFinal";
import { VisorDocumento } from "../src/ui/VisorDocumento";

describe("el verificador de lenguaje", () => {
  it("detecta palabras técnicas, sin importar mayúsculas", () => {
    expect(palabrasTecnicas("El endpoint de la API usa un framework")).toEqual(["endpoint", "api", "framework"]);
    expect(palabrasTecnicas("Hicimos TDD y un Pull Request")).toEqual(["tdd", "pull request"]);
  });

  it("no confunde palabras comunes con jerga", () => {
    expect(palabrasTecnicas("Una aplicación nueva, con apuntes y capital")).toEqual([]);
  });

  it("mide la oración más larga en palabras", () => {
    expect(oracionMasLarga("Hola. Esta frase tiene cinco palabras. Chau!")).toBe(5);
    expect(oracionMasLarga("")).toBe(0);
  });
});

// ── todo lo que lee la persona, de punta a punta ──
const sinEtiquetas = (html: string) =>
  html
    // cada bloque (renglón de lista, párrafo, título, botón) es una frase aparte para quien lee
    .replace(/<\/(li|p|h[1-6]|div|article|section|button|aside|ol|ul)>/g, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

/** Cada texto suelto de un objeto (cada renglón de una lista es una frase aparte). */
function hojas(valor: unknown, camino = ""): { camino: string; texto: string }[] {
  if (typeof valor === "string") return [{ camino, texto: valor }];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => hojas(v, `${camino}[${i}]`));
  if (valor && typeof valor === "object") return Object.entries(valor).flatMap(([k, v]) => hojas(v, camino ? `${camino}.${k}` : k));
  return [];
}

function textosVisibles(): { origen: string; texto: string }[] {
  const salida: { origen: string; texto: string }[] = [];
  const agregar = (origen: string, texto: string) => salida.push({ origen, texto });

  for (const a of AGENTES) {
    for (const h of hojas(textosDe(a.id))) agregar(`contenido ${a.id} ${h.camino}`, h.texto);
    for (const estado of ["deshabilitado", "habilitado", "corriendo", "terminado"] as const) {
      agregar(`panel ${a.id} ${estado}`, sinEtiquetas(renderToString(<PanelAgente indice={a.numero - 1} estado={estado} briefDejado={true} alOrdenar={() => {}} alCerrar={() => {}} alLeer={() => {}} />)));
    }
    agregar(`visor ${a.id}`, sinEtiquetas(renderToString(<VisorDocumento indice={a.numero - 1} alCerrar={() => {}} />)));
  }
  for (const h of hojas(BRIEF_EJEMPLO)) agregar(`brief ${h.camino}`, h.texto);
  agregar("pantalla final", sinEtiquetas(renderToString(<PantallaFinal alReiniciar={() => {}} />)));
  agregar("pantalla inicial", sinEtiquetas(renderToString(<App />)));

  let e: Estado = ESTADO_INICIAL;
  agregar("guía inicial", mensajeGuia(e));
  e = reducir(e, { tipo: "dejarBrief" });
  for (let i = 0; i < AGENTES.length; i++) {
    agregar(`guía agente ${i + 1} habilitado`, mensajeGuia(e));
    e = reducir(e, { tipo: "ordenarCorrer", indice: i });
    agregar(`guía agente ${i + 1} corriendo`, mensajeGuia(e));
    e = reducir(e, { tipo: "terminarCorrida", indice: i });
  }
  agregar("guía al terminar el último", mensajeGuia(e));
  return salida;
}

describe("los textos que lee la persona", () => {
  const todos = textosVisibles();

  it("no usan jerga de programación", () => {
    for (const { origen, texto } of todos) expect(palabrasTecnicas(texto), origen).toEqual([]);
  });

  it("usan oraciones cortas, fáciles de seguir", () => {
    for (const { origen, texto } of todos) expect(oracionMasLarga(texto), origen).toBeLessThanOrEqual(30);
  });

  it("cada comando con nombre en inglés se explica en español con «significa»", () => {
    for (const a of AGENTES) {
      const t = textosDe(a.id);
      expect(t.queHace, a.id).toContain("significa");
      expect(t.queHace, a.id).toContain(`«${t.nombre}»`);
    }
  });

  it("cada agente dice qué hace, para qué sirve y qué produjo", () => {
    for (const a of AGENTES) {
      const t = textosDe(a.id);
      expect(t.queHace.length, a.id).toBeGreaterThan(30);
      expect(t.paraQueSirve.startsWith("Sirve para"), a.id).toBe(true);
      expect(t.documento.titulo.length, a.id).toBeGreaterThan(5);
    }
  });

  it("la primera frase explica qué es el brief con otras palabras", () => {
    const inicial = mensajeGuia(ESTADO_INICIAL).toLowerCase();
    expect(inicial).toContain("brief");
    expect(inicial).toMatch(/idea|pedido/);
  });

  it("revisa una cantidad razonable de textos, para que el test no sea vacío", () => {
    expect(todos.length).toBeGreaterThan(40);
  });
});
