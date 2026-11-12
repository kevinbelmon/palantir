import { describe, expect, it } from "vitest";
import { LOBBY, PAPELERIA, rellenoSobrePuerta, SALAS, tirasDeMuro, type Rect } from "../src/oficina";
import { BEBEDERO, MESA_PAPELERIA, OBJETOS_SALA } from "../src/oficina/decoracion";
import { duracionDeCircuito, PERSONAS_AMBIENTE, poseDeCircuito } from "../src/oficina/gente";
import { huellaDeAsiento, huellaDeLibreria, huellasDeSala, MESAS_RATONAS, mueblesDeSala, RADIO_COLUMNA, RECEPCION, SOFAS_LOBBY } from "../src/escena/distribucion";
import { ALTO_DINTEL, ALTO_MARCO, GROSOR_MARCO } from "../src/escena/identidad";
import { ALTURA_ATRIO, ALTURA_OJOS, ALTURA_TECHO, ESCALA_CASA, obstaculos, OJOS_EN_CASA, RADIO_JUGADOR, tocaRect } from "../src/escena/persona";

const cerca = (a: number, b: number, d: number) => Math.abs(a - b) <= d;
const cruzan = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const puertaDe = (s: (typeof SALAS)[number]) => (s.tipo === "vidrio" ? "izquierda" : s.area.y < LOBBY.y ? "abajo" : "arriba");

/** El ancho libre que queda en el lado de la puerta, medido sobre las tiras de pared de verdad. */
function huecoDePuerta(s: (typeof SALAS)[number]): number {
  const puerta = puertaDe(s);
  const tiras = tirasDeMuro(s.area, puerta, 16);
  if (puerta === "izquierda") {
    const [a, b] = tiras.filter((t) => t.lado === "oeste").sort((p, q) => p.rect.y - q.rect.y);
    return b.rect.y - (a.rect.y + a.rect.h);
  }
  const lado = puerta === "abajo" ? "sur" : "norte";
  const [a, b] = tiras.filter((t) => t.lado === lado).sort((p, q) => p.rect.x - q.rect.x);
  return b.rect.x - (a.rect.x + a.rect.w);
}

/** La distancia de un mueble a la pared más cercana de su ambiente (0 = pegado). */
function aLaPared(m: Rect, area: Rect): number {
  return Math.min(m.x - (area.x + 8), area.x + area.w - 8 - (m.x + m.w), m.y - (area.y + 8), area.y + area.h - 8 - (m.y + m.h));
}

describe("el tamaño de la casa", () => {
  it("los pasillos dejan 140 libres entre caras de pared, no entre zonas", () => {
    const arriba = Math.max(...SALAS.filter((s) => s.area.y < LOBBY.y).map((s) => s.area.y + s.area.h));
    const abajo = Math.min(...SALAS.filter((s) => s.area.y > LOBBY.y).map((s) => s.area.y));
    // la pared mide 16: lo que queda libre es el pasillo menos su espesor
    expect(LOBBY.y - arriba - 16).toBeGreaterThanOrEqual(140);
    expect(abajo - (LOBBY.y + LOBBY.h) - 16).toBeGreaterThanOrEqual(140);
    expect(LOBBY.y - arriba).toBeGreaterThanOrEqual(200);
  });

  it("el atrio del lobby es más alto que las oficinas", () => {
    expect(ALTURA_ATRIO).toBeGreaterThan(ALTURA_TECHO * 1.6);
  });

  it("al caminar, la casa crece 1,8 veces y los ojos quedan a unos 200", () => {
    expect(ESCALA_CASA).toBe(1.8);
    expect(cerca(OJOS_EN_CASA, ALTURA_OJOS * ESCALA_CASA * 0.8, 0.5)).toBe(true);
    expect(OJOS_EN_CASA).toBeGreaterThan(190);
    expect(OJOS_EN_CASA).toBeLessThan(215);
  });
});

describe("las puertas", () => {
  it("todas dejan un hueco de 130 y la persona de 52 pasa sin trabarse", () => {
    for (const s of SALAS) {
      const hueco = huecoDePuerta(s);
      expect(hueco, `sala ${s.numero}`).toBeCloseTo(130);
      expect(hueco - RADIO_JUGADOR * 2, `sala ${s.numero}`).toBeGreaterThanOrEqual(52);
    }
    const pape = tirasDeMuro(PAPELERIA, "arriba", 16).filter((t) => t.lado === "norte").sort((p, q) => p.rect.x - q.rect.x);
    expect(pape[1].rect.x - (pape[0].rect.x + pape[0].rect.w)).toBeCloseTo(130);
  });

  it("el marco es 4 más grueso que la pared: por eso no titila", () => {
    expect(GROSOR_MARCO).toBe(16 + 4);
  });

  it("sobre el dintel la pared sigue hasta el techo, con el mismo ancho del hueco", () => {
    for (const s of SALAS) {
      const relleno = rellenoSobrePuerta(s.area, puertaDe(s));
      // la pared de la sala de vidrio corre a lo largo del eje z; las demás, del eje x
      const esVidrio = s.tipo === "vidrio";
      expect(relleno.w, `sala ${s.numero}`).toBeCloseTo(esVidrio ? 16 : 130);
      expect(relleno.h, `sala ${s.numero}`).toBeCloseTo(esVidrio ? 130 : 16);
      expect(ALTO_MARCO + ALTO_DINTEL).toBeLessThan(ALTURA_TECHO);
    }
    const pape = rellenoSobrePuerta(PAPELERIA, "arriba");
    expect(pape.w).toBeCloseTo(130);
    expect(pape.h).toBeCloseTo(16);
    // el relleno arranca donde termina el dintel del marco
    const s = SALAS[0];
    const relleno = rellenoSobrePuerta(s.area, "abajo");
    expect(relleno.y + relleno.h / 2).toBeCloseTo(s.area.y + s.area.h);
  });
});

describe("los muebles están contra las paredes", () => {
  it("el respaldo de cada sillón queda a menos de 8 de una pared de verdad", () => {
    const paredesLobby = [PAPELERIA.x + PAPELERIA.w + 8, SALAS[7].area.x - 8];
    for (const s of SOFAS_LOBBY) {
      const respaldo = s.giro > 0 ? s.x - s.fondo / 2 : s.x + s.fondo / 2;
      expect(Math.min(...paredesLobby.map((p) => Math.abs(p - respaldo))), `sillón del lobby en ${s.x},${s.z}`).toBeLessThanOrEqual(8);
    }
    for (const s of SALAS) {
      const m = mueblesDeSala(s);
      if (!m) continue;
      const respaldo = m.sillon.x - m.sillon.fondo / 2;
      expect(Math.abs(s.area.x + 8 - respaldo), `sillón de la sala ${s.numero}`).toBeLessThanOrEqual(8);
    }
  });

  it("la biblioteca, la lámpara y el bebedero también tocan pared", () => {
    for (const s of SALAS) {
      const m = mueblesDeSala(s);
      if (!m) continue;
      expect(aLaPared(huellaDeLibreria(m.libreria), s.area), `biblioteca sala ${s.numero}`).toBeLessThanOrEqual(8);
      expect(cerca(m.lampara.x + 15, s.area.x + s.area.w - 8, 45) || cerca(m.lampara.x - 15, s.area.x + 8, 45) || cerca(m.lampara.z - 15, s.area.y + 8, 45), `lámpara sala ${s.numero}`).toBe(true);
    }
    expect(Math.abs(SALAS[7].area.x - 8 - (BEBEDERO.x + BEBEDERO.w))).toBeLessThanOrEqual(12);
  });

  it("ningún mueble del lobby se pisa con otro ni con las columnas", () => {
    const piezas = [...SOFAS_LOBBY.map(huellaDeAsiento), ...MESAS_RATONAS, RECEPCION];
    piezas.forEach((a, i) => piezas.slice(i + 1).forEach((b) => expect(cruzan(a, b)).toBe(false)));
    for (const s of SALAS) {
      const huellas = huellasDeSala(s);
      for (const h of huellas) for (const r of huellas) if (h !== r) expect(cruzan(h, r)).toBe(false);
    }
    expect(RADIO_COLUMNA).toBeGreaterThanOrEqual(24);
  });

  it("ningún objeto de sala flota en el medio", () => {
    for (const o of OBJETOS_SALA) {
      const s = SALAS[o.sala];
      expect(aLaPared({ x: o.x, y: o.y, w: o.w, h: o.h }, s.area), `objeto sala ${s.numero}`).toBeLessThanOrEqual(20);
    }
  });
});

describe("la gente tiene siempre algo que hacer", () => {
  const anclas: { x: number; z: number }[] = [
    { x: RECEPCION.x + RECEPCION.w / 2, z: RECEPCION.y + RECEPCION.h / 2 },
    { x: BEBEDERO.x + BEBEDERO.w / 2, z: BEBEDERO.y + BEBEDERO.h / 2 },
    { x: MESA_PAPELERIA.x + MESA_PAPELERIA.w / 2, z: MESA_PAPELERIA.y + MESA_PAPELERIA.h / 2 },
    ...SOFAS_LOBBY.map((s) => ({ x: s.x, z: s.z })),
    ...SALAS.filter((s) => s.tipo !== "vidrio").map((s) => s.pizarra).map((p) => ({ x: p.x + p.w / 2, z: p.y + p.h / 2 })),
  ];

  it("nadie está parado sin tarea: quien está quieto trabaja junto a algo que usa", () => {
    const quietas = PERSONAS_AMBIENTE.filter((p) => p.modo === "quieta");
    expect(quietas.length).toBeGreaterThanOrEqual(6);
    for (const p of quietas) {
      if (p.modo !== "quieta") continue;
      expect(["teclea", "charla", "escribe", "lee", "consulta"], p.id).toContain(p.actividad);
      const menor = Math.min(...anclas.map((a) => Math.hypot(a.x - p.x, a.z - p.z)));
      expect(menor, `${p.id} no está junto a nada`).toBeLessThanOrEqual(130);
    }
  });

  it("quien camina siempre termina consultando algo, con pausas cortas y sin trabarse", () => {
    for (const p of PERSONAS_AMBIENTE.filter((q) => q.modo === "camina")) {
      if (p.modo !== "camina") continue;
      expect(p.circuito.some((q) => q.hace !== undefined), p.id).toBe(true);
      for (const q of p.circuito) expect(q.pausa, `${p.id} se queda demasiado`).toBeLessThanOrEqual(7.5);
      const ciclo = duracionDeCircuito(p.circuito, p.velocidad);
      let antes = poseDeCircuito(p.circuito, p.velocidad, 0);
      for (let t = 0.2; t < ciclo; t += 0.2) {
        const ahora = poseDeCircuito(p.circuito, p.velocidad, t);
        expect(Math.hypot(ahora.x - antes.x, ahora.z - antes.z), p.id).toBeLessThan(30);
        antes = ahora;
      }
    }
  });

  it("nadie está parado dentro de una pared o un mueble", () => {
    const obs = obstaculos();
    for (const p of PERSONAS_AMBIENTE) {
      // quien está sentado se apoya en el sillón: eso es un mueble, no un error
      if (p.modo !== "quieta" || p.sentada) continue;
      expect(obs.some((c) => tocaRect(p.x, p.z, 14, c)), p.id).toBe(false);
    }
  });
});
