import { describe, expect, it } from "vitest";
import {
  arrastrar,
  camaraAjustada,
  factorRueda,
  limitesZoom,
  MUNDO,
  mundoAPantalla,
  pantallaAMundo,
  zoomEn,
} from "../src/oficina";

const VISTA = { ancho: 1280, alto: 720 };

describe("convertir entre pantalla y mundo", () => {
  it("ida y vuelta da el mismo punto", () => {
    const c = { x: 300, y: 200, zoom: 0.8 };
    const m = pantallaAMundo(c, 400, 250);
    const p = mundoAPantalla(c, m.x, m.y);
    expect(p.x).toBeCloseTo(400);
    expect(p.y).toBeCloseTo(250);
  });
});

describe("arrastrar con el clic derecho", () => {
  it("arrastrar hacia la derecha mueve el mapa hacia la derecha", () => {
    const c = camaraAjustada(VISTA.ancho, VISTA.alto);
    const antes = mundoAPantalla(c, 1000, 800);
    const nueva = arrastrar(c, 100, 0, VISTA);
    const despues = mundoAPantalla(nueva, 1000, 800);
    expect(despues.x - antes.x).toBeCloseTo(100, 1);
    expect(despues.y).toBeCloseTo(antes.y, 1);
  });

  it("al arrastrar abajo el mapa baja", () => {
    const c = { x: 500, y: 500, zoom: 1 };
    const nueva = arrastrar(c, 0, 60, VISTA);
    expect(nueva.y).toBeCloseTo(440);
  });

  it("nunca se pierde la oficina: el centro de la vista queda dentro del mundo", () => {
    let c = { x: 500, y: 500, zoom: 1 };
    c = arrastrar(c, 100000, 100000, VISTA);
    const centro = pantallaAMundo(c, VISTA.ancho / 2, VISTA.alto / 2);
    expect(centro.x).toBeGreaterThanOrEqual(0);
    expect(centro.y).toBeGreaterThanOrEqual(0);
    c = arrastrar(c, -400000, -400000, VISTA);
    const centro2 = pantallaAMundo(c, VISTA.ancho / 2, VISTA.alto / 2);
    expect(centro2.x).toBeLessThanOrEqual(MUNDO.ancho);
    expect(centro2.y).toBeLessThanOrEqual(MUNDO.alto);
  });
});

describe("zoom con la rueda", () => {
  it("girar hacia adelante acerca y hacia atrás aleja", () => {
    expect(factorRueda(-100)).toBeGreaterThan(1);
    expect(factorRueda(100)).toBeLessThan(1);
    expect(factorRueda(-100) * factorRueda(100)).toBeCloseTo(1);
  });

  it("el punto bajo el mouse no se mueve al hacer zoom", () => {
    const c = { x: 400, y: 300, zoom: 0.7 };
    const antes = pantallaAMundo(c, 600, 350);
    const nueva = zoomEn(c, 1.4, 600, 350, VISTA);
    const despues = pantallaAMundo(nueva, 600, 350);
    expect(nueva.zoom).toBeGreaterThan(c.zoom);
    expect(despues.x).toBeCloseTo(antes.x, 1);
    expect(despues.y).toBeCloseTo(antes.y, 1);
  });

  it("no se acerca ni se aleja más de los límites", () => {
    const { min, max } = limitesZoom(VISTA.ancho, VISTA.alto);
    let c = camaraAjustada(VISTA.ancho, VISTA.alto);
    for (let i = 0; i < 60; i++) c = zoomEn(c, 1.5, 600, 350, VISTA);
    expect(c.zoom).toBeCloseTo(max);
    for (let i = 0; i < 120; i++) c = zoomEn(c, 0.6, 600, 350, VISTA);
    expect(c.zoom).toBeCloseTo(min);
  });

  it("al máximo de zoom la oficina es más grande que la pantalla (hay que moverse para recorrerla)", () => {
    const { max } = limitesZoom(VISTA.ancho, VISTA.alto);
    expect(MUNDO.ancho * max).toBeGreaterThan(VISTA.ancho);
    expect(MUNDO.alto * max).toBeGreaterThan(VISTA.alto);
  });
});

describe("el margen para la barra superior", () => {
  it("deja el borde de arriba de la oficina por debajo de la barra", () => {
    const c = camaraAjustada(1700, 1000, 64);
    const arriba = mundoAPantalla(c, 0, 0).y;
    const abajo = mundoAPantalla(c, 0, MUNDO.alto).y;
    expect(arriba).toBeGreaterThanOrEqual(63.5);
    expect(abajo).toBeLessThanOrEqual(1000.5);
  });

  it("sin margen se comporta como antes", () => {
    expect(camaraAjustada(1700, 1000)).toEqual(camaraAjustada(1700, 1000, 0));
  });
});

describe("el margen para el dock de abajo", () => {
  it("deja el borde de abajo de la oficina por encima del dock", () => {
    const c = camaraAjustada(1700, 1000, 64, 96);
    expect(mundoAPantalla(c, 0, 0).y).toBeGreaterThanOrEqual(63.5);
    expect(mundoAPantalla(c, 0, MUNDO.alto).y).toBeLessThanOrEqual(1000 - 96 + 0.5);
  });
});
