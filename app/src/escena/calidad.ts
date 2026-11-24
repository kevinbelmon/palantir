// Los niveles bajan en este orden, de lo que menos se nota a lo que más: 1) sombras más espaciadas, 2) sin efectos de cine,
// 3 y 4) menos resolución. La nitidez es lo último que se toca.
// El regulador de calidad: la casa se dibuja con efectos de cine (brillo, bordes suaves, resolución alta), pero en una compu
// sin placa de video potente eso hace que todo vaya a saltos. Si los cuadros por segundo bajan de `FPS_MINIMO`, se baja de nivel
// solo; la persona no tiene que tocar nada.

/** Menos de estos cuadros por segundo se considera que la compu no da abasto. */
export const FPS_MINIMO = 24;

/** Cuántos niveles hay: 0 es la calidad completa y el último es el más liviano. */
export const NIVEL_MAXIMO = 4;

/** La resolución máxima de cada nivel (1 es un píxel de la pantalla por cada uno del dibujo). */
/** Nunca baja de 1: por debajo, los carteles con letra chica se emborronan y no se leen. */
export const PROPORCION_POR_NIVEL: readonly number[] = [1.75, 1.75, 1.75, 1.5, 1.25];

/** Cada cuántos cuadros se vuelven a dibujar las sombras (el mapa de sombras es lo más caro de cada cuadro). */
export const SOMBRA_CADA_NIVEL: readonly number[] = [2, 6, 6, 8, 8];

/** Si en ese nivel se usan los efectos (brillo, revelado y viñeta). */
export const EFECTOS_POR_NIVEL: readonly boolean[] = [true, true, false, false, false];

/** El nivel al que hay que pasar según los cuadros por segundo medidos: baja de a uno y nunca sube solo. */
export function nivelSegunFps(nivel: number, fps: number): number {
  return fps < FPS_MINIMO && nivel < NIVEL_MAXIMO ? nivel + 1 : nivel;
}

export type MedidorDeFps = {
  /** Se llama una vez por cuadro dibujado. Devuelve los cuadros por segundo cuando se cumple una ventana de medición, y `null` el resto de las veces. */
  cuadro: (ahora: number) => number | null;
  /** Empieza de cero (por ejemplo, después de una pausa, para que el rato parado no cuente como lento). */
  reiniciar: () => void;
};

/**
 * Mide los cuadros por segundo en ventanas de `ventanaMs`. Ignora los primeros `calentamientoMs`, porque al arrancar
 * la tarjeta de video está compilando y los primeros cuadros siempre son lentos.
 */
export function crearMedidorDeFps(ventanaMs = 1500, calentamientoMs = 2500): MedidorDeFps {
  let inicio = -1;
  let desde = 0;
  let cuadros = 0;
  return {
    cuadro(ahora) {
      if (inicio < 0) {
        inicio = ahora;
        desde = ahora;
      }
      if (ahora - inicio < calentamientoMs) {
        desde = ahora;
        cuadros = 0;
        return null;
      }
      cuadros += 1;
      if (ahora - desde < ventanaMs) return null;
      const fps = (cuadros * 1000) / (ahora - desde);
      desde = ahora;
      cuadros = 0;
      return fps;
    },
    reiniciar() {
      inicio = -1;
      cuadros = 0;
    },
  };
}
