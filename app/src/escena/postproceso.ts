import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// Lo justo para que la casa se vea a cine sin ensuciar la imagen: un brillo suave en las lámparas y
// una viñeta al final. Todo lo demás (contraste, color, grano) se hace después de revelar la imagen,
// porque si se hace antes los negros se lavan y aparece ruido por todos lados.

export type Postproceso = {
  /** Dibuja un cuadro completo (con los efectos). */
  render: (escena: THREE.Scene, camara: THREE.Camera) => void;
  /** La ventana cambió de tamaño. */
  ajustar: (ancho: number, alto: number, proporcion: number) => void;
  liberar: () => void;
};

/** La última pasada: una viñeta apenas marcada y un toque de frío en las sombras. Ya sobre la imagen revelada. */
const Remate = {
  name: "Remate",
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    intensidad: { value: 0.18 },
    resolucion: { value: new THREE.Vector2(1, 1) },
    tiempo: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float intensidad;
    uniform vec2 resolucion;
    uniform float tiempo;

    void main() {
      // aberración de lente: casi invisible en el centro, apenas marcada en los bordes
      vec2 d = vUv - 0.5;
      vec2 off = d * dot(d, d) * 0.0022;
      vec3 c = vec3(
        texture2D(tDiffuse, vUv + off).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv - off).b
      );

      // sombras un poco frías, luces un poco cálidas (muy suave, sin teñir la escena)
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c *= mix(vec3(0.97, 0.99, 1.03), vec3(1.03, 1.01, 0.98), smoothstep(0.0, 0.85, luma));

      // viñeta: solo en los bordes
      float v = smoothstep(1.05, 0.35, length(vUv - 0.5));
      c *= mix(1.0, v, intensidad);

      // grano fino, como el de una foto: se nota sobre todo en los grises
      float n = fract(sin(dot(vUv * resolucion + tiempo, vec2(12.9898, 78.233))) * 43758.5453);
      c += (n - 0.5) * 0.014 * (1.0 - smoothstep(0.6, 1.0, luma));

      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

/** Arma la tubería de dibujo: escena → brillo → revelado → remate. */
export function crearPostproceso(renderer: THREE.WebGLRenderer, escena: THREE.Scene, camara: THREE.Camera, ancho: number, alto: number): Postproceso {
  const proporcion = Math.min(window.devicePixelRatio || 1, 1.6);
  const objetivo = new THREE.WebGLRenderTarget(Math.max(1, Math.round(ancho * proporcion)), Math.max(1, Math.round(alto * proporcion)), {
    type: THREE.HalfFloatType,
    samples: 4,
  });
  const composer = new EffectComposer(renderer, objetivo);
  composer.setPixelRatio(proporcion);
  composer.setSize(ancho, alto);

  composer.addPass(new RenderPass(escena, camara));

  // sin lámparas encendidas el brillo casi no tiene de dónde salir: queda apenas para las pantallas
  const brillo = new UnrealBloomPass(new THREE.Vector2(ancho, alto), 0.06, 0.3, 2.1);
  composer.addPass(brillo);

  // revelado: curva de tonos ACES y paso a sRGB, una sola vez
  composer.addPass(new OutputPass());

  const remate = new ShaderPass(Remate);
  composer.addPass(remate);

  return {
    render(escenaActual, camaraActual) {
      (composer.passes[0] as RenderPass).scene = escenaActual;
      (composer.passes[0] as RenderPass).camera = camaraActual;
      remate.uniforms.tiempo.value = performance.now() / 1000;
      composer.render();
    },
    ajustar(nuevoAncho, nuevoAlto, nuevaProporcion) {
      composer.setPixelRatio(nuevaProporcion);
      composer.setSize(nuevoAncho, nuevoAlto);
      brillo.setSize(nuevoAncho, nuevoAlto);
      remate.uniforms.resolucion.value.set(nuevoAncho * nuevaProporcion, nuevoAlto * nuevaProporcion);
    },
    liberar() {
      composer.dispose();
      objetivo.dispose();
    },
  };
}
