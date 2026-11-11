import { describe, expect, it } from "vitest";
import { LOBBY, MUNDO, SALAS } from "../src/oficina";
import { candidatos, entradaDeSala, girarJugador, JUGADOR_INICIAL, moverJugador, objetivoDeInteraccion, obstaculos, RADIO_JUGADOR, salaDe, tocaRect, type Jugador } from "../src/escena/persona";

const parado = (x: number, z: number, yaw = 0): Jugador => ({ x, z, yaw, pitch: 0 });
const nadie = Array(8).fill(false);

describe("chocar con las cosas", () => {
  it("un círculo toca un rectángulo si se le mete adentro, y no si queda a distancia", () => {
    const r = { x: 0, y: 0, w: 100, h: 100 };
    expect(tocaRect(50, 50, 10, r)).toBe(true);
    expect(tocaRect(105, 50, 10, r)).toBe(true);
    expect(tocaRect(120, 50, 10, r)).toBe(false);
    expect(tocaRect(108, 108, 10, r)).toBe(false);
  });

  it("la persona arranca en el lobby y libre, sin estar metida en nada", () => {
    expect(obstaculos().some((c) => tocaRect(JUGADOR_INICIAL.x, JUGADOR_INICIAL.z, RADIO_JUGADOR, c))).toBe(false);
    expect(JUGADOR_INICIAL.x).toBeGreaterThan(LOBBY.x);
    expect(JUGADOR_INICIAL.x).toBeLessThan(LOBBY.x + LOBBY.w);
  });
});

describe("caminar", () => {
  it("adelante con yaw 0 va hacia el norte (z baja); atrás, al revés", () => {
    const a = moverJugador(parado(1210, 700), { adelante: 1, lateral: 0, correr: false }, 0.5);
    expect(a.z).toBeLessThan(700);
    expect(a.x).toBeCloseTo(1210);
    const b = moverJugador(parado(1210, 700), { adelante: -1, lateral: 0, correr: false }, 0.5);
    expect(b.z).toBeGreaterThan(700);
  });

  it("la derecha es el este con yaw 0, y girar 90° cambia hacia dónde es «adelante»", () => {
    expect(moverJugador(parado(1210, 700), { adelante: 0, lateral: 1, correr: false }, 0.5).x).toBeGreaterThan(1210);
    const mirandoOeste = moverJugador(parado(1210, 700, Math.PI / 2), { adelante: 1, lateral: 0, correr: false }, 0.5);
    expect(mirandoOeste.x).toBeLessThan(1210);
    expect(mirandoOeste.z).toBeCloseTo(700);
  });

  it("correr es más rápido que caminar, y en diagonal no se va más rápido", () => {
    const camina = moverJugador(parado(1210, 700), { adelante: 1, lateral: 0, correr: false }, 0.1);
    const corre = moverJugador(parado(1210, 700), { adelante: 1, lateral: 0, correr: true }, 0.1);
    expect(700 - corre.z).toBeGreaterThan(700 - camina.z);
    const diagonal = moverJugador(parado(1210, 700), { adelante: 1, lateral: 1, correr: false }, 0.1);
    expect(Math.hypot(diagonal.x - 1210, diagonal.z - 700)).toBeCloseTo(Math.hypot(camina.x - 1210, camina.z - 700));
  });

  it("sin entrada o sin tiempo, se queda donde está", () => {
    const j = parado(1210, 700);
    expect(moverJugador(j, { adelante: 0, lateral: 0, correr: false }, 1)).toBe(j);
    expect(moverJugador(j, { adelante: 1, lateral: 0, correr: false }, 0)).toBe(j);
  });
});

describe("paredes y muebles", () => {
  it("no atraviesa una pared aunque camine mucho tiempo", () => {
    const sala = SALAS[0];
    // adentro de la sala 1, caminando hacia el norte: tiene que frenar antes de la pared
    let j = parado(sala.area.x + 100, sala.area.y + 200);
    for (let i = 0; i < 200; i++) j = moverJugador(j, { adelante: 1, lateral: 0, correr: true }, 0.05);
    expect(j.z).toBeGreaterThan(sala.area.y);
    expect(obstaculos().some((c) => tocaRect(j.x, j.z, RADIO_JUGADOR - 1, c))).toBe(false);
  });

  it("se desliza por la pared en vez de quedarse pegado", () => {
    const sala = SALAS[0];
    let j = parado(sala.area.x + 100, sala.area.y + 40, -Math.PI / 4);
    for (let i = 0; i < 20; i++) j = moverJugador(j, { adelante: 1, lateral: 0, correr: false }, 0.05);
    expect(j.x).toBeGreaterThan(sala.area.x + 100);
  });

  it("puede pasar por las puertas: de una sala de arriba al lobby", () => {
    const sala = SALAS[1];
    let j = parado(sala.area.x + sala.area.w / 2, sala.area.y + sala.area.h - 30, Math.PI);
    for (let i = 0; i < 80; i++) j = moverJugador(j, { adelante: 1, lateral: 0, correr: false }, 0.05);
    expect(j.z).toBeGreaterThan(sala.area.y + sala.area.h + 40);
  });

  it("si empieza tocando un mueble, puede alejarse y no queda atrapada", () => {
    const s = SALAS[1];
    const pegada = parado(s.area.x + s.area.w / 2, s.escritorio.y + 100 + 10, Math.PI);
    const despues = moverJugador(pegada, { adelante: 1, lateral: 0, correr: false }, 0.1);
    expect(despues.z).toBeGreaterThan(pegada.z);
  });

  it("no se sale del edificio", () => {
    let j = parado(300, 700, Math.PI / 2);
    for (let i = 0; i < 400; i++) j = moverJugador(j, { adelante: 1, lateral: 0, correr: true }, 0.05);
    expect(j.x).toBeGreaterThan(0);
    expect(j.x).toBeLessThan(MUNDO.ancho);
  });

  it("no atraviesa los escritorios", () => {
    const s = SALAS[0];
    let j = parado(s.escritorio.x + 150, s.escritorio.y + 200, 0);
    for (let i = 0; i < 80; i++) j = moverJugador(j, { adelante: 1, lateral: 0, correr: false }, 0.05);
    expect(j.z).toBeGreaterThan(s.escritorio.y + 90);
  });
});

describe("entrar a una oficina", () => {
  it("aparece adentro de la sala, libre de muebles y paredes, y no queda en otra sala", () => {
    SALAS.forEach((s, i) => {
      const j = entradaDeSala(s);
      expect(salaDe(j), `sala ${i + 1}`).toBe(i);
      expect(obstaculos().some((c) => tocaRect(j.x, j.z, RADIO_JUGADOR, c)), `sala ${i + 1}`).toBe(false);
    });
  });

  it("mira hacia adentro de la sala: hacia su centro y no hacia la puerta", () => {
    for (const sala of SALAS) {
      const jug = entradaDeSala(sala);
      const mira = { x: -Math.sin(jug.yaw), z: -Math.cos(jug.yaw) };
      const alCentro = { x: sala.area.x + sala.area.w / 2 - jug.x, z: sala.area.y + sala.area.h / 2 - jug.z };
      expect(mira.x * alCentro.x + mira.z * alCentro.z, `sala ${sala.numero}`).toBeGreaterThan(0);
    }
  });
});

describe("mirar", () => {
  it("mover el mouse a la derecha gira a la derecha, y mirar arriba y abajo tiene tope", () => {
    expect(girarJugador(parado(0, 0), 100, 0).yaw).toBeLessThan(0);
    expect(girarJugador(parado(0, 0), 0, -100000).pitch).toBeLessThanOrEqual(1.2);
    expect(girarJugador(parado(0, 0), 0, 100000).pitch).toBeGreaterThanOrEqual(-1.2);
  });

  it("sabe en qué sala está, o que no está en ninguna", () => {
    const s = SALAS[3];
    expect(salaDe(parado(s.area.x + 50, s.area.y + 50))).toBe(3);
    expect(salaDe(JUGADOR_INICIAL)).toBeNull();
  });
});

describe("con qué se puede interactuar", () => {
  const s = SALAS[0];
  const frenteAlAgente = (yaw: number) => parado(s.personaje.x, s.personaje.y + 150, yaw);

  it("el agente que está adelante y cerca", () => {
    expect(objetivoDeInteraccion(frenteAlAgente(0), nadie)).toEqual({ tipo: "agente", indice: 0 });
  });

  it("nada si le das la espalda, o si está lejos", () => {
    expect(objetivoDeInteraccion(frenteAlAgente(Math.PI), nadie)).toBeNull();
    expect(objetivoDeInteraccion(parado(s.personaje.x, s.personaje.y + 600), nadie)).toBeNull();
  });

  it("el documento aparece solo si el agente terminó", () => {
    const todos = candidatos(nadie).filter((c) => c.elemento.tipo === "documento");
    expect(todos).toHaveLength(0);
    const hechos = [true, ...Array(7).fill(false)];
    expect(candidatos(hechos).filter((c) => c.elemento.tipo === "documento")).toHaveLength(1);
  });

  it("la papelería se puede tocar cerca de su mesa", () => {
    const j = parado(310, 1010, 0);
    expect(objetivoDeInteraccion(j, nadie)).toEqual({ tipo: "papeleria" });
  });

  it("entre dos opciones, elige la más cercana y más al centro de la vista", () => {
    const e = objetivoDeInteraccion(parado(s.personaje.x + 10, s.personaje.y + 120, 0), [true, ...Array(7).fill(false)]);
    expect(e).not.toBeNull();
  });
});
