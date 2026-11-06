import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AVISO_SIN_PROGRAMA, crearCliente, SIN_CONEXION } from "../src/conexion";
import { ESTADO_INICIAL, reducir } from "../src/flujo";
import { BotonRepo, PanelRepo } from "../src/ui/PanelRepo";
import { VisorDocumento } from "../src/ui/VisorDocumento";

const json = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });

describe("el cliente del programa local", () => {
  it("manda el link del repo y devuelve el estado", async () => {
    let visto: { ruta: string; cuerpo: unknown } | null = null;
    const c = crearCliente(async (ruta, cuerpo) => {
      visto = { ruta, cuerpo };
      return json({ ...SIN_CONEXION, repo: "https://github.com/a/b.git", modeloInstalado: true });
    });
    const e = await c.conectarRepo("https://github.com/a/b");
    expect(visto).toEqual({ ruta: "/api/repo", cuerpo: { url: "https://github.com/a/b" } });
    expect(e.modeloInstalado).toBe(true);
  });

  it("si el programa local no está encendido, explica cómo encenderlo", async () => {
    const c = crearCliente(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(c.estado()).rejects.toThrow(AVISO_SIN_PROGRAMA);
    expect(AVISO_SIN_PROGRAMA).toContain("pnpm servidor");
  });

  it("si lo que contesta no es del programa local, también lo dice", async () => {
    const c = crearCliente(async () => new Response("<html>otra cosa</html>", { status: 200 }));
    await expect(c.estado()).rejects.toThrow(AVISO_SIN_PROGRAMA);
  });

  it("muestra el mensaje de error que manda el programa local", async () => {
    const c = crearCliente(async () => json({ error: "Primero conectá un repositorio." }, 409));
    await expect(c.subirBrief("un brief")).rejects.toThrow("Primero conectá un repositorio.");
  });
});

describe("cancelar una corrida que falló", () => {
  const corriendo = reducir(reducir(reducir(ESTADO_INICIAL, { tipo: "dejarBrief" }), { tipo: "ordenarCorrer", indice: 0 }), { tipo: "abrirDocumento", indice: 0 });

  it("el agente vuelve a esperar la orden y el brief no avanza", () => {
    const e = reducir(corriendo, { tipo: "cancelarCorrida", indice: 0 });
    expect(e.agentes[0]).toBe("habilitado");
    expect(e.agentes[1]).toBe("deshabilitado");
  });

  it("si el agente no estaba corriendo, no hace nada", () => {
    expect(reducir(ESTADO_INICIAL, { tipo: "cancelarCorrida", indice: 3 })).toBe(ESTADO_INICIAL);
  });
});

describe("«Tu repositorio»", () => {
  const cliente = crearCliente();
  const html = (estado = SIN_CONEXION) => renderToString(<PanelRepo estado={estado} cliente={cliente} alCambiar={() => {}} alCerrar={() => {}} />);

  it("al empezar pide solo el link del repo", () => {
    const h = html();
    expect(h).toContain("Link del repositorio");
    expect(h).not.toContain("Tu brief");
  });

  it("con el modelo instalado pide el brief, y avisa que va a usar su Claude al estar subido", () => {
    expect(html({ ...SIN_CONEXION, repo: "https://github.com/a/b.git", modeloInstalado: true })).toContain("Tu brief");
    expect(html({ ...SIN_CONEXION, repo: "x", modeloInstalado: true, briefSubido: true })).toContain("usa tu cuenta de Claude");
  });

  it("el botón de arriba dice si hay un repo conectado", () => {
    expect(renderToString(<BotonRepo conectado={false} alAbrir={() => {}} />)).toContain("Conectar repo");
    expect(renderToString(<BotonRepo conectado alAbrir={() => {}} />)).toContain("Repo conectado");
  });
});

describe("el documento real", () => {
  it("muestra lo que produjo el agente en vez del ejemplo", () => {
    const h = renderToString(<VisorDocumento indice={0} alCerrar={() => {}} real="El brief quedó claro." />);
    expect(h).toContain("El brief quedó claro.");
    expect(h).toContain("de verdad");
    expect(h).not.toContain("gastos entre amigos");
  });

  it("sin texto real sigue mostrando el ejemplo simplificado", () => {
    expect(renderToString(<VisorDocumento indice={0} alCerrar={() => {}} />)).toContain("gastos entre amigos");
  });
});
