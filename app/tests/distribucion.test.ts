import { describe, expect, it } from "vitest";
import { LOBBY, SALAS, type Rect } from "../src/oficina";
import { OBJETOS_SALA } from "../src/oficina/decoracion";
import { COLUMNAS, huellasDeSala, MESAS_RATONAS, mueblesDeSala, obstaculosDeMuebles, RADIO_COLUMNA, SOFAS_LOBBY, huellaDeAsiento } from "../src/escena/distribucion";
import { JUGADOR_INICIAL, obstaculos, RADIO_JUGADOR, tocaRect } from "../src/escena/persona";

const cruzan = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const dentro = (r: Rect, area: Rect, margen = 0) => r.x >= area.x + margen && r.y >= area.y + margen && r.x + r.w <= area.x + area.w - margen && r.y + r.h <= area.y + area.h - margen;

describe("el mobiliario de las oficinas", () => {
  const normales = SALAS.filter((s) => s.tipo !== "vidrio");

  it("las siete oficinas comunes tienen sillón, biblioteca y lámpara; la de vidrio no", () => {
    expect(normales).toHaveLength(7);
    for (const s of normales) expect(mueblesDeSala(s)).not.toBeNull();
    expect(mueblesDeSala(SALAS[7])).toBeNull();
    expect(huellasDeSala(SALAS[7])).toEqual([]);
  });

  it("todo queda adentro de su oficina, sin pisar las paredes", () => {
    for (const s of normales) for (const h of huellasDeSala(s)) expect(dentro(h, s.area, 8), `sala ${s.numero}`).toBe(true);
  });

  it("no se pisan entre sí ni con el escritorio, el objeto de la sala ni el agente", () => {
    for (const s of normales) {
      const huellas = huellasDeSala(s);
      const objeto = OBJETOS_SALA.find((o) => o.sala === SALAS.indexOf(s))!;
      const fijos: Rect[] = [
        { x: s.escritorio.x - 6, y: s.escritorio.y + 4, w: s.escritorio.w + 12, h: 96 },
        { x: objeto.x, y: objeto.y + objeto.h - 45, w: objeto.w, h: 45 },
        { x: s.personaje.x - 40, y: s.personaje.y - 34, w: 80, h: 70 },
      ];
      huellas.forEach((h, i) => {
        for (const f of fijos) expect(cruzan(h, f), `sala ${s.numero} mueble ${i}`).toBe(false);
        huellas.slice(i + 1).forEach((o) => expect(cruzan(h, o)).toBe(false));
      });
    }
  });

  it("dejan libre el camino de la puerta al escritorio", () => {
    for (const s of normales) {
      const cx = s.area.x + s.area.w / 2;
      const pasillo: Rect = { x: cx - 60, y: s.area.y, w: 120, h: s.area.h };
      for (const h of huellasDeSala(s)) expect(cruzan(h, pasillo), `sala ${s.numero}`).toBe(false);
    }
  });
});

describe("el mobiliario del lobby", () => {
  it("las columnas están en el borde norte del lobby, lejos de las puertas de arriba", () => {
    expect(COLUMNAS.length).toBeGreaterThanOrEqual(4);
    const puertas = SALAS.filter((s) => s.area.y < LOBBY.y).map((s) => s.area.x + s.area.w / 2);
    for (const c of COLUMNAS) {
      expect(c.x).toBeGreaterThan(LOBBY.x);
      expect(c.x).toBeLessThan(LOBBY.x + LOBBY.w);
      for (const p of puertas) expect(Math.abs(c.x - p) - RADIO_COLUMNA).toBeGreaterThan(70);
    }
  });

  it("los sillones y las mesas ratonas quedan adentro del lobby y no se pisan", () => {
    const huellas = [...SOFAS_LOBBY.map(huellaDeAsiento), ...MESAS_RATONAS];
    for (const h of huellas) expect(dentro(h, LOBBY)).toBe(true);
    huellas.forEach((h, i) => huellas.slice(i + 1).forEach((o) => expect(cruzan(h, o)).toBe(false)));
  });

  it("la persona sigue arrancando libre y se puede ir del lobby a cada oficina", () => {
    expect(obstaculos().some((c) => tocaRect(JUGADOR_INICIAL.x, JUGADOR_INICIAL.z, RADIO_JUGADOR, c))).toBe(false);
    expect(obstaculosDeMuebles().length).toBeGreaterThan(10);
  });
});
