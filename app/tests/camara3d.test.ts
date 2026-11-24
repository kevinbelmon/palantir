import { describe, expect, it } from "vitest";
import { MUNDO, SALAS } from "../src/oficina";
import {
  arrastrar3d,
  camara3dEnSala,
  camara3dInicial,
  interpolar3d,
  limitesDistancia,
  pantallaAPlano,
  posicionDeCamara,
  proyectar,
  zoom3d,
  type Camara3D,
} from "../src/escena";

const VISTA = { ancho: 1700, alto: 1000 };
const BARRA = 64;
const DOCK = 96;
const base: Camara3D = { x: 1300, z: 800, distancia: 2400, inclinacion: 0.9, giro: 0 };
const cerca = (a: number, b: number, d = 0.5) => Math.abs(a - b) <= d;

describe("la posición de la cámara", () => {
  it("está a la distancia pedida del punto que mira", () => {
    const p = posicionDeCamara(base);
    const d = Math.hypot(p.x - base.x, p.y - 0, p.z - base.z);
    expect(d).toBeCloseTo(base.distancia, 3);
  });

  it("mira desde el sur y desde arriba: la oficina se ve con el norte hacia arriba", () => {
    const p = posicionDeCamara(base);
    expect(p.z).toBeGreaterThan(base.z);
    expect(p.y).toBeGreaterThan(0);
  });
});

describe("proyectar y elegir con el mouse", () => {
  it("el punto que mira la cámara queda en el centro de la pantalla", () => {
    const s = proyectar(base, VISTA, { x: base.x, y: 0, z: base.z });
    expect(cerca(s.x, VISTA.ancho / 2)).toBe(true);
    expect(cerca(s.y, VISTA.alto / 2)).toBe(true);
  });

  it("lo que está a la derecha en el mundo queda a la derecha en pantalla, y el norte queda arriba", () => {
    const centro = proyectar(base, VISTA, { x: base.x, y: 0, z: base.z });
    const derecha = proyectar(base, VISTA, { x: base.x + 300, y: 0, z: base.z });
    const norte = proyectar(base, VISTA, { x: base.x, y: 0, z: base.z - 300 });
    expect(derecha.x).toBeGreaterThan(centro.x);
    expect(norte.y).toBeLessThan(centro.y);
  });

  it("lo lejano se ve más chico: perspectiva de verdad", () => {
    const cercaDelFrente = proyectar(base, VISTA, { x: base.x + 200, y: 0, z: base.z + 600 });
    const centro = proyectar(base, VISTA, { x: base.x, y: 0, z: base.z + 600 });
    const lejos = proyectar(base, VISTA, { x: base.x + 200, y: 0, z: base.z - 600 });
    const lejosCentro = proyectar(base, VISTA, { x: base.x, y: 0, z: base.z - 600 });
    expect(Math.abs(cercaDelFrente.x - centro.x)).toBeGreaterThan(Math.abs(lejos.x - lejosCentro.x));
  });

  it("ida y vuelta: proyectar un punto del piso y elegirlo con el mouse da el mismo punto", () => {
    for (const [x, z] of [[500, 300], [1300, 800], [2200, 1400], [100, 1500]]) {
      const s = proyectar(base, VISTA, { x, y: 0, z });
      const p = pantallaAPlano(base, VISTA, s.x, s.y);
      expect(p).not.toBeNull();
      expect(cerca(p!.x, x, 0.01)).toBe(true);
      expect(cerca(p!.z, z, 0.01)).toBe(true);
    }
  });

  it("mirar al cielo no elige nada del piso", () => {
    expect(pantallaAPlano({ ...base, inclinacion: 0.2, distancia: 100 }, VISTA, 850, 0)).toBeNull();
  });
});

describe("arrastrar con el clic derecho", () => {
  it("el punto del piso que estaba bajo el mouse sigue bajo el mouse", () => {
    const inicio = { x: 800, y: 500 };
    const p = pantallaAPlano(base, VISTA, inicio.x, inicio.y)!;
    const c2 = arrastrar3d(base, 120, 60, VISTA, inicio.x, inicio.y);
    const s = proyectar(c2, VISTA, { x: p.x, y: 0, z: p.z });
    expect(cerca(s.x, inicio.x + 120, 1)).toBe(true);
    expect(cerca(s.y, inicio.y + 60, 1)).toBe(true);
  });

  it("nunca se pierde la oficina: el punto que mira queda dentro del mundo", () => {
    let c = base;
    for (let i = 0; i < 60; i++) c = arrastrar3d(c, 400, 300, VISTA, 800, 500);
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.x).toBeLessThanOrEqual(MUNDO.ancho);
    expect(c.z).toBeGreaterThanOrEqual(0);
    expect(c.z).toBeLessThanOrEqual(MUNDO.alto);
    for (let i = 0; i < 120; i++) c = arrastrar3d(c, -400, -300, VISTA, 800, 500);
    expect(c.x).toBeLessThanOrEqual(MUNDO.ancho);
    expect(c.z).toBeLessThanOrEqual(MUNDO.alto);
  });
});

describe("el zoom con la rueda", () => {
  it("el punto del piso bajo el mouse no se mueve al acercar", () => {
    const p = pantallaAPlano(base, VISTA, 1000, 400)!;
    const c2 = zoom3d(base, 0.8, VISTA, 1000, 400);
    expect(c2.distancia).toBeLessThan(base.distancia);
    const s = proyectar(c2, VISTA, { x: p.x, y: 0, z: p.z });
    expect(cerca(s.x, 1000, 1)).toBe(true);
    expect(cerca(s.y, 400, 1)).toBe(true);
  });

  it("no se acerca ni se aleja más de los límites", () => {
    const { min, max } = limitesDistancia(VISTA);
    expect(min).toBeLessThan(max);
    let c = camara3dInicial(VISTA, BARRA, DOCK);
    for (let i = 0; i < 80; i++) c = zoom3d(c, 0.7, VISTA, 800, 500);
    expect(c.distancia).toBeCloseTo(min, 3);
    for (let i = 0; i < 160; i++) c = zoom3d(c, 1.4, VISTA, 800, 500);
    expect(c.distancia).toBeCloseTo(max, 3);
  });
});

describe("la vista inicial", () => {
  it("muestra toda la oficina, entre la barra de arriba y el dock de abajo", () => {
    const c = camara3dInicial(VISTA, BARRA, DOCK);
    const esquinas = [[0, 0], [MUNDO.ancho, 0], [MUNDO.ancho, MUNDO.alto], [0, MUNDO.alto]];
    for (const [x, z] of esquinas) {
      const s = proyectar(c, VISTA, { x, y: 0, z });
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(VISTA.ancho);
      expect(s.y).toBeGreaterThanOrEqual(BARRA - 1);
      expect(s.y).toBeLessThanOrEqual(VISTA.alto - DOCK + 1);
    }
  });
});

describe("la cámara que va a una sala", () => {
  it("encuadra la sala entera y la centra en la zona visible", () => {
    for (const sala of SALAS) {
      const c = camara3dEnSala(sala, VISTA, BARRA, DOCK);
      const a = sala.area;
      const esquinas = [[a.x, a.y], [a.x + a.w, a.y], [a.x + a.w, a.y + a.h], [a.x, a.y + a.h]];
      const pantalla = esquinas.map(([x, z]) => proyectar(c, VISTA, { x, y: 0, z }));
      for (const s of pantalla) {
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x).toBeLessThanOrEqual(VISTA.ancho);
        expect(s.y).toBeGreaterThanOrEqual(BARRA - 1);
        expect(s.y).toBeLessThanOrEqual(VISTA.alto - DOCK + 1);
      }
      const centroY = (Math.min(...pantalla.map((s) => s.y)) + Math.max(...pantalla.map((s) => s.y))) / 2;
      expect(cerca(centroY, BARRA + (VISTA.alto - BARRA - DOCK) / 2, 8)).toBe(true);
    }
  });

  it("se acerca más que la vista de toda la oficina", () => {
    const todo = camara3dInicial(VISTA, BARRA, DOCK).distancia;
    for (const sala of SALAS) expect(camara3dEnSala(sala, VISTA, BARRA, DOCK).distancia).toBeLessThan(todo);
  });
});

describe("el viaje de la cámara", () => {
  const a: Camara3D = { x: 0, z: 0, distancia: 3000, inclinacion: 0.9, giro: 0 };
  const b: Camara3D = { x: 1000, z: 400, distancia: 900, inclinacion: 0.9, giro: 0 };

  it("empieza en el origen y termina en el destino", () => {
    expect(interpolar3d(a, b, 0)).toEqual(a);
    expect(interpolar3d(a, b, 1)).toEqual(b);
  });

  it("avanza siempre hacia adelante y, si se pasa del rango, se queda en los extremos", () => {
    let antes = -Infinity;
    for (let k = 0; k <= 1; k += 0.05) {
      const x = interpolar3d(a, b, k).x;
      expect(x).toBeGreaterThanOrEqual(antes);
      antes = x;
    }
    expect(interpolar3d(a, b, -3)).toEqual(a);
  });

  it("con arco, la cámara se aleja a mitad de camino y llega igual al destino", () => {
    const a = camara3dEnSala(SALAS[0], { ancho: 1400, alto: 800 });
    const b = camara3dEnSala(SALAS[3], { ancho: 1400, alto: 800 });
    const arco = 300;
    expect(interpolar3d(a, b, 0, arco)).toEqual(a);
    expect(interpolar3d(a, b, 1, arco).distancia).toBeCloseTo(b.distancia, 6);
    const medio = interpolar3d(a, b, 0.5, arco);
    expect(medio.distancia).toBeCloseTo((a.distancia + b.distancia) / 2 + arco, 6);
    // sin arco no cambia nada respecto de siempre
    expect(interpolar3d(a, b, 0.5).distancia).toBeCloseTo((a.distancia + b.distancia) / 2, 6);
    expect(interpolar3d(a, b, 9)).toEqual(b);
  });
});
