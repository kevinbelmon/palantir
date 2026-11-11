/** Colores de la oficina: tonos suaves, como en la foto de referencia. Todo se dibuja en código. */
export const PALETA = {
  fondo: "#262a40",
  edificio: "#3a3f52",
  sueloSala: "#3c3f4c",
  sueloLineas: "#2c2f3b",
  sueloLobby: "#2f323e",
  alfombra: "#2e3358",
  pared: "#2b2e3a",
  zocalo: "#14151c",
  muro: "#2b2e3a",
  ladrilloLinea: "#1d2029",
  cartelFondo: "#1e2033",
  cartelTexto: "#ffffff",
  cartelSub: "#aab0d8",
  pizarraFondo: "#f8f9ff",
  pizarraBorde: "#c9cde8",
  pizarraTexto: "#3a3e5c",
  check: "#3ecf6e",
  maderaFrente: "#c98f4e",
  maderaTapa: "#e3b277",
  maderaLado: "#a9743a",
  sillaColor: "#2b2f4a",
  monitorMarco: "#1d2133",
  monitorPantalla: "#5b8cff",
  monitorPantalla2: "#3ecf6e",
  planta: "#4caf6a",
  plantaOscura: "#2f8f52",
  maceta: "#c0734a",
  sillon: "#3b3466",
  sillonClaro: "#4a4280",
  agua: "#9bd6f2",
  piel: "#f6d24a",
  vidrio: "rgba(190, 225, 245, 0.28)",
  vidrioBorde: "rgba(170, 215, 240, 0.9)",
  papel: "#fffdf3",
  resalte: "#ffd54a",
} as const;

/** Los puntos de estado: gris en espera, verde te toca, amarillo trabajando, azul listo. */
export const COLORES_ESTADO = { gris: "#8b8fb0", verde: "#3ecf6e", amarillo: "#ffd54a", azul: "#5b8cff" } as const;

/** Camisa y pelo de cada agente: así se distinguen a simple vista. */
export const APARIENCIAS = [
  { camisa: "#5b8cff", pelo: "#3a2a1f" },
  { camisa: "#8e6bff", pelo: "#1f1f2e" },
  { camisa: "#3ecf6e", pelo: "#7a4a22" },
  { camisa: "#f2a33a", pelo: "#2b1d14" },
  { camisa: "#ff6b81", pelo: "#d9822b" },
  { camisa: "#2ec4b6", pelo: "#1c1c1c" },
  { camisa: "#f5d142", pelo: "#5a3b22" },
  { camisa: "#a0a4c8", pelo: "#b8651f" },
] as const;
