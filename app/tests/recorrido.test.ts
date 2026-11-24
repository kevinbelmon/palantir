import { describe, expect, it } from "vitest";
import { oracionMasLarga, palabrasTecnicas } from "../src/contenido";
import { AGENTES } from "../src/flujo";
import { MUNDO, PAPELERIA, SALAS, type Rect } from "../src/oficina";
import { CAPITULOS, COMANDOS_DEL_MODELO, construirRecorrido, MARGEN_FUERA_DE_LA_CASA, duracionDePaso, duracionDeTipeo, PRESENTACION, primerPasoDe, textoVisible } from "../src/ui/recorridoGuion";
import { faseInicial } from "../src/ui/recorridoReloj";

const pasos = construirRecorrido();
const dentro = (r: Rect, c: Rect) => r.x >= c.x - 0.5 && r.y >= c.y - 0.5 && r.x + r.w <= c.x + c.w + 0.5 && r.y + r.h <= c.y + c.h + 0.5;
const area = (r: Rect) => r.w * r.h;
const casa: Rect = { x: 0, y: 0, w: MUNDO.ancho, h: MUNDO.alto };
/** La casa más un poco de pasto alrededor: arriba de las oficinas de la fila de arriba hace falta lugar para el cartel. */
const casaConPasto: Rect = { x: -MARGEN_FUERA_DE_LA_CASA, y: -MARGEN_FUERA_DE_LA_CASA, w: MUNDO.ancho + MARGEN_FUERA_DE_LA_CASA * 2, h: MUNDO.alto + MARGEN_FUERA_DE_LA_CASA * 2 };

describe("la presentación de bienvenida", () => {
  it("explica qué es el SDD, el modelo en tres ideas y los ocho comandos principales", () => {
    expect(PRESENTACION[0].titulo).toBe("Bienvenidos al SDD");
    expect(PRESENTACION[0].texto).toContain("Spec-Driven Development");
    expect(PRESENTACION[1].puntos).toHaveLength(3);
    expect(PRESENTACION[1].puntos?.[0].titulo).toContain("documentamos");
    expect(PRESENTACION[1].puntos?.[1].titulo).toContain("puliendo");
    expect(PRESENTACION[2].titulo).toContain(String(COMANDOS_DEL_MODELO));
    expect(PRESENTACION[2].puntos).toHaveLength(AGENTES.length);
  });

  it("no usa jerga y tiene oraciones cortas", () => {
    for (const pagina of PRESENTACION) {
      const textos = [pagina.titulo, pagina.texto ?? "", ...(pagina.puntos ?? []).flatMap((p) => [p.titulo, p.texto])];
      for (const t of textos) {
        expect(palabrasTecnicas(t), t).toEqual([]);
        expect(oracionMasLarga(t), t).toBeLessThanOrEqual(30);
      }
    }
  });

  it("arranca con la presentación; ?recorrido=1 va directo al recorrido y ?presentacion=0 directo al juego", () => {
    expect(faseInicial("")).toBe("presentacion");
    expect(faseInicial("?otra=cosa")).toBe("presentacion");
    expect(faseInicial("?recorrido=1")).toBe("recorrido");
    expect(faseInicial("?presentacion=0")).toBe("juego");
    expect(faseInicial(null)).toBe("juego");
  });
});

describe("el recorrido explicado", () => {
  it("empieza con Zac presentándose, mirando toda la casa, y termina invitando a dejar el brief", () => {
    expect(pasos[0].titulo).toContain("Zac");
    expect(pasos[0].zona).toEqual(casa);
    expect(pasos[0].marca).toBeNull();
    expect(pasos[pasos.length - 1].titulo).toBe("Ahora podés empezar");
  });

  it("explica la papelería con el brief sobre la mesa y la señala", () => {
    const p = pasos.filter((x) => x.capitulo === 1);
    expect(p.length).toBeGreaterThanOrEqual(2);
    expect(p[0].texto.toLowerCase()).toContain("papelería");
    // los dos primeros pasos señalan la papelería; el tercero es la transición hacia las oficinas y no señala nada
    for (const x of p.slice(0, 2)) {
      expect(x.marca).not.toBeNull();
      expect(dentro(x.marca as Rect, PAPELERIA)).toBe(true);
    }
    // en el segundo paso el brief ya está dejado: se habilita el primer agente
    expect(p[1].texto.toLowerCase()).toContain("brief");
    expect(p[1].estado.briefDejado).toBe(true);
  });

  it("no muestra el lobby: del capítulo de la papelería se pasa directo a las oficinas", () => {
    expect(CAPITULOS).not.toContain("El lobby");
    for (const p of pasos) expect(`${p.titulo} ${p.texto}`.toLowerCase(), p.titulo).not.toContain("lobby");
    expect(CAPITULOS.slice(0, 3)).toEqual(["Bienvenida", "La papelería", CAPITULOS[2]]);
    expect(pasos.filter((x) => x.capitulo === 1).pop()?.titulo).toBe("El camino del brief");
  });

  it("visita las ocho oficinas en orden, cada una con tres momentos (qué es, qué hace y el documento que deja) y, salvo la última, un traslado a la siguiente", () => {
    AGENTES.forEach((a, i) => {
      const delAgente = pasos.filter((p) => p.capitulo === 2 + i);
      expect(delAgente, a.id).toHaveLength(i < AGENTES.length - 1 ? 4 : 3);
      const [queEs, queHace, queDeja] = delAgente;
      expect(queEs.titulo).toBe(`Oficina ${a.numero} · ${CAPITULOS[2 + i]}`);
      expect(queHace.titulo).toBe(`Cómo trabaja ${CAPITULOS[2 + i]}`);
      expect(queDeja.titulo).toBe(`Entregable de ${CAPITULOS[2 + i]}`);
      expect(queHace.estado.agentes[i]).toBe("corriendo");
      expect(queDeja.estado.agentes[i]).toBe("terminado");
      // el primer momento dice qué significa el nombre del comando, y el último nombra el documento que deja
      expect(queEs.texto).toContain("significa");
      expect(queDeja.texto).toContain("documento");
      // los que están antes ya terminaron y los que vienen después todavía no
      for (let j = 0; j < i; j++) expect(queHace.estado.agentes[j]).toBe("terminado");
      for (let j = i + 1; j < AGENTES.length; j++) expect(queHace.estado.agentes[j]).not.toBe("terminado");
    });
  });

  it("entre una oficina y la siguiente hay un paso de traslado: la cámara abre el plano y se ve viajar al brief", () => {
    AGENTES.slice(0, -1).forEach((a, i) => {
      const traslado = pasos.filter((p) => p.capitulo === 2 + i)[3];
      expect(traslado.titulo).toBe(`Hacia la oficina ${a.numero + 1}`);
      expect(traslado.marca).toBeNull();
      // el estado es el del camino activo: terminó esta oficina y se habilita la siguiente, que es cuando el papel recorre la ruta
      expect(traslado.estado.agentes[i]).toBe("terminado");
      expect(traslado.estado.agentes[i + 1]).toBe("habilitado");
      // se encuadran las dos oficinas juntas
      expect(dentro(SALAS[i].area, traslado.zona), `oficina ${a.numero} en el traslado`).toBe(true);
      expect(dentro(SALAS[i + 1].area, traslado.zona), `oficina ${a.numero + 1} en el traslado`).toBe(true);
      // y es corto: lo justo para ver viajar al brief
      expect(duracionDePaso(traslado)).toBeLessThanOrEqual(7000);
    });
    // después de la última oficina no hay traslado
    expect(pasos.filter((p) => p.capitulo === 2 + AGENTES.length - 1)).toHaveLength(3);
  });

  it("explica cada comando en un tono profesional: sin comparaciones domésticas ni ejemplos infantiles", () => {
    const prohibidas = ["ladrillo", "posta", "arquitecto", "receta", "juguete", "casita", "chicos", "niños", "ayudantes"];
    for (const p of [...pasos, ...PRESENTACION.map((x) => ({ titulo: x.titulo, texto: [x.texto ?? "", ...(x.puntos ?? []).map((y) => `${y.titulo} ${y.texto}`)].join(" ") }))]) {
      const texto = `${p.titulo} ${p.texto}`.toLowerCase();
      for (const palabra of prohibidas) expect(texto, `«${palabra}» en «${p.titulo}»`).not.toContain(palabra);
    }
  });

  it("señala el lugar donde trabaja cada agente, encuadra la oficina de cerca y después se acerca al agente", () => {
    AGENTES.forEach((_, i) => {
      const [queEs, queHace, queDeja] = pasos.filter((x) => x.capitulo === 2 + i);
      for (const p of [queEs, queHace, queDeja]) {
        expect(p.marca, `oficina ${i + 1}`).not.toBeNull();
        expect(dentro(p.marca as Rect, SALAS[i].area), `marca de la oficina ${i + 1}`).toBe(true);
        expect(dentro(p.marca as Rect, p.zona), `la cámara de la oficina ${i + 1} deja ver lo señalado`).toBe(true);
      }
      // oficina de cerca: no se ve mucho más que la oficina, pero con lugar arriba para que se lea el cartel con su nombre
      if (SALAS[i].tipo === "normal") {
        expect(dentro(SALAS[i].area, queEs.zona)).toBe(true);
        expect(area(queEs.zona), `zoom de la oficina ${i + 1}`).toBeLessThan(area(SALAS[i].area) * 1.7);
      }
      // y de cerca de verdad: la oficina ocupa casi todo el encuadre (poco aire alrededor, salvo arriba para el cartel)
      if (SALAS[i].tipo === "normal") expect(area(queEs.zona), `la oficina ${i + 1} de cerca`).toBeLessThan(area(SALAS[i].area) * 1.5);
      // el cartel sube hasta ~215 sobre el borde de arriba (o ~46 antes del borde en las de abajo): tiene que entrar en el encuadre
      expect(queEs.zona.y, `lugar para el cartel de la oficina ${i + 1}`).toBeLessThanOrEqual(SALAS[i].area.y - 100);
      // y al hablar del agente, más cerca todavía, pero con lugar arriba para que no se le corte el globito
      expect(area(queHace.zona), `zoom al agente ${i + 1}`).toBeLessThan(area(queEs.zona));
      expect(queHace.marca && queHace.marca.y - queHace.zona.y, `lugar para el globito de la oficina ${i + 1}`).toBeGreaterThanOrEqual(120);
      expect(queDeja.zona).toEqual(queHace.zona);
    });
  });

  it("todas las cámaras quedan dentro de la casa y los capítulos van en orden", () => {
    let anterior = 0;
    for (const p of pasos) {
      expect(dentro(p.zona, casaConPasto)).toBe(true);
      expect(p.capitulo).toBeGreaterThanOrEqual(anterior);
      expect(p.capitulo).toBeLessThan(CAPITULOS.length);
      anterior = p.capitulo;
    }
    CAPITULOS.forEach((_, c) => expect(pasos[primerPasoDe(c, pasos)].capitulo).toBe(c));
  });

  it("los textos no usan jerga y tienen oraciones cortas", () => {
    for (const p of pasos) {
      const texto = `${p.titulo}. ${p.texto}`;
      expect(palabrasTecnicas(texto), texto).toEqual([]);
      expect(oracionMasLarga(texto), texto).toBeLessThanOrEqual(30);
      expect(p.texto.length, p.titulo).toBeGreaterThan(40);
    }
  });

  it("Zac escribe despacio: el texto crece con el tiempo y se completa al terminar de tipear", () => {
    const p = pasos[0];
    expect(textoVisible(p, 0)).toBe("");
    const a = textoVisible(p, 1000);
    const b = textoVisible(p, 2000);
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(a.length);
    expect(p.texto.startsWith(b)).toBe(true);
    expect(textoVisible(p, duracionDeTipeo(p) + 50)).toBe(p.texto);
  });

  it("deja tiempo para leer: cada paso dura más de lo que tarda en escribirse y no pasa de medio minuto", () => {
    for (const p of pasos) {
      expect(duracionDePaso(p), p.titulo).toBeGreaterThan(duracionDeTipeo(p) + 3000);
      expect(duracionDePaso(p), p.titulo).toBeLessThan(30_000);
    }
  });
});
