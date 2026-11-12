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
    intensidad: { value: 0.38 },
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

    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;

      // sombras un poco frías, luces un poco cálidas (muy suave, sin teñir la escena)
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c *= mix(vec3(0.97, 0.99, 1.03), vec3(1.03, 1.01, 0.98), smoothstep(0.0, 0.85, luma));

      // viñeta: solo en los bordes
      float v = smoothstep(1.05, 0.35, length(vUv - 0.5));
      c *= mix(1.0, v, intensidad);

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

  // brillo: solo lo que de verdad es una fuente de luz (paneles, lámparas, lucernario)
  const brillo = new UnrealBloomPass(new THREE.Vector2(ancho, alto), 0.38, 0.55, 0.95);
  composer.addPass(brillo);

  // revelado: curva de tonos ACES y paso a sRGB, una sola vez
  composer.addPass(new OutputPass());

  const remate = new ShaderPass(Remate);
  composer.addPass(remate);

  return {
    render(escenaActual, camaraActual) {
      (composer.passes[0] as RenderPass).scene = escenaActual;
      (composer.passes[0] as RenderPass).camera = camaraActual;
      composer.render();
    },
    ajustar(nuevoAncho, nuevoAlto, nuevaProporcion) {
      composer.setPixelRatio(nuevaProporcion);
      composer.setSize(nuevoAncho, nuevoAlto);
      brillo.setSize(nuevoAncho, nuevoAlto);
    },
    liberar() {
      composer.dispose();
      objetivo.dispose();
    },
  };
}
