import { describe, expect, it } from "vitest";
import { duracionDeCircuito, PERSONAS_AMBIENTE, poseDe, poseDeCircuito, SALAS } from "../src/oficina";
import { obstaculos, tocaRect } from "../src/escena/persona";

const circuito = [
  { x: 0, z: 0, pausa: 2 },
  { x: 100, z: 0, pausa: 1 },
];

describe("el recorrido de quien camina", () => {
  it("espera en cada parada y después camina hacia la siguiente", () => {
    expect(poseDeCircuito(circuito, 50, 1)).toMatchObject({ x: 0, z: 0, caminando: false });
    const a = poseDeCircuito(circuito, 50, 3);
    expect(a.caminando).toBe(true);
    expect(a.x).toBeCloseTo(50);
    expect(poseDeCircuito(circuito, 50, 4.5)).toMatchObject({ x: 100, caminando: false });
  });

  it("mira hacia donde va, con el cuerpo girado sobre Y (0 al sur, π/2 al este)", () => {
    expect(poseDeCircuito(circuito, 50, 3).giro).toBeCloseTo(Math.PI / 2);
    expect(poseDeCircuito([{ x: 0, z: 0, pausa: 0 }, { x: 0, z: 100, pausa: 0 }], 50, 1).giro).toBeCloseTo(0);
  });

  it("es un ciclo: vuelve al principio y dura lo esperado", () => {
    expect(duracionDeCircuito(circuito, 50)).toBeCloseTo(2 + 2 + 1 + 2);
    expect(poseDeCircuito(circuito, 50, 7)).toMatchObject(poseDeCircuito(circuito, 50, 0));
  });

  it("nunca salta de lugar entre un instante y el siguiente", () => {
    for (const p of PERSONAS_AMBIENTE.filter((q) => q.modo === "camina")) {
      let antes = poseDe(p, 0);
      for (let t = 0.1; t < 200; t += 0.1) {
        const ahora = poseDe(p, t);
        expect(Math.hypot(ahora.x - antes.x, ahora.z - antes.z), p.id).toBeLessThan(10);
        antes = ahora;
      }
    }
  });
});

describe("la gente de ambiente", () => {
  const obs = obstaculos();
  const radio = 14;

  it("hay recepcionista, charla, lectores y quienes recorren los pasillos", () => {
    const ids = PERSONAS_AMBIENTE.map((p) => p.id);
    for (const id of ["recepcion", "charla-a", "charla-b", "lector-este", "lector-oeste", "papeleria", "pasillo-norte", "pasillo-sur", "lobby", "papeleria-ida"]) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("los que están de pie no pisan paredes ni muebles", () => {
    for (const p of PERSONAS_AMBIENTE.filter((q) => q.modo === "quieta" && !q.sentada)) {
      if (p.modo !== "quieta") continue;
      expect(obs.some((c) => tocaRect(p.x, p.z, radio, c)), p.id).toBe(false);
    }
  });

  it("los que caminan recorren solo lugares libres, a lo largo de todo el circuito", () => {
    for (const p of PERSONAS_AMBIENTE.filter((q) => q.modo === "camina")) {
      if (p.modo !== "camina") continue;
      const ciclo = duracionDeCircuito(p.circuito, p.velocidad);
      for (let t = 0; t < ciclo; t += 0.25) {
        const { x, z } = poseDeCircuito(p.circuito, p.velocidad, t);
        expect(obs.some((c) => tocaRect(x, z, radio, c)), `${p.id} en t=${t.toFixed(2)} (${Math.round(x)}, ${Math.round(z)})`).toBe(false);
      }
    }
  });

  it("los que visitan una oficina paran adentro de ella", () => {
    const norte = PERSONAS_AMBIENTE.find((p) => p.id === "pasillo-norte");
    const sur = PERSONAS_AMBIENTE.find((p) => p.id === "pasillo-sur");
    for (const [p, sala] of [[norte, SALAS[2]], [sur, SALAS[5]]] as const) {
      if (p?.modo !== "camina") throw new Error("falta el recorrido");
      const adentro = p.circuito.some((q) => q.x > sala.area.x && q.x < sala.area.x + sala.area.w && q.z > sala.area.y && q.z < sala.area.y + sala.area.h);
      expect(adentro, p.id).toBe(true);
    }
  });
});
