# Tasks — 901-juego-sdd (Juego del modelo operativo)

Cada task es un corte vertical. TDD: tests primero. Sin nombres de funciones.

- [x] **T001** — Scaffold: app React con TypeScript y Vite en `app/`, puerto fijo 5173, Vitest y
      `pnpm dev` / `pnpm test` con una pantalla vacía. Crea: `app/`. · US: —
- [x] **T002** — Ver la oficina: oficina grande en perspectiva con 8 salas en orden (cartel,
      pizarra, escritorio), lobby, papelería y 8 personajes. Crea: `oficina/`, `ui/`. · US: US-1
- [x] **T003** — Decorar como la foto: plantas, sillón, bebedero, sala de vidrio para el review
      y paleta. Toca: `oficina/`. · US: US-1
- [x] **T004** — Mover la cámara: clic derecho arrastrando y zoom con la rueda. · US: US-2
- [x] **T005** — Dejar el brief en la papelería: habilita al agente 1. Crea: `flujo/`, brief en
      `contenido/`. · US: US-3
- [x] **T006** — Ordenar correr: animación corta y globito que explica qué hace. · US: US-4
- [x] **T007** — Leer lo que produjo: documento simplificado por agente, que se abre y cierra.
      Crea: documentos en `contenido/`. · US: US-5
- [x] **T008** — Avanzar en orden: solo se habilita el siguiente; nadie corre solo. · US: US-6
- [x] **T009** — Pantalla final con repaso y botón "Jugar de nuevo". Crea: `ui/`. · US: US-7
- [x] **T010** — Música chill generada con el sonido del navegador, que arranca con el primer
      clic y se puede silenciar. Crea: `musica/`. · US: US-8
- [x] **T011** — Textos simples: cada agente dice qué hace, para qué sirve y qué produjo, sin
      jerga sin explicar (con test sobre el contenido). Toca: `contenido/`. · US: US-9
- [x] **T012** — Cierre: `pnpm test` en verde, `pnpm audit:sdd` sin FAIL y recorrido completo en
      `localhost:5173`. · US: —
- [x] **T013** — Oficina con vida: ruta con flechas, personajes que respiran y parpadean, objetos
      por sala, barra superior con el paso y animaciones que se apagan si el sistema lo pide.
      Toca: `oficina/`, `flujo/`, `ui/`. · US: US-10
- [x] **T014** — Estilo de bloques: piso con tacos, ladrillos, muebles y personajes de bloques;
      etiqueta con el comando sobre cada uno; dock con estado, tareas que faltan y «te toca»;
      la cámara viaja a la sala al tocar un agente. Toca: `oficina/`, `flujo/`, `ui/`. · US: US-11
- [x] **T015** — Mundo en 3D con Three.js: piso con tacos, ladrillos, luces y sombras, muñecos y
      objetos de bloques, ruta, carteles, etiquetas, globitos, cámara con clic derecho y rueda, y
      respaldo en 2D si no hay 3D. Crea: `app/src/escena/`. · US: US-1
- [x] **T016** — Panel lateral «Paso a paso»: los 8 comandos en orden con su estado; al tocar uno,
      la cámara viaja a su sala y se despliega una frase corta de para qué sirve (frase en
      `contenido/`, con test de que es corta y sin jerga). Toca: `contenido/`, `ui/`. · US: US-12
- [x] **T017** — Aspecto moderno: barra de arriba, botón de música y carteles sin emojis, con
      logo e íconos dibujados en código, estilo plano. Toca: `ui/`, `escena/`. · US: US-13
