# Tasks — 901-juego-sdd (Juego del modelo operativo)

Cada task es un corte vertical. TDD: tests primero. Sin nombres de funciones.

- [x] **T001** — Scaffold: app React con TypeScript y Vite en `app/`, puerto fijo 5173, Vitest, y
      `pnpm dev` / `pnpm test` funcionando con una pantalla vacía. Crea: `app/`. · US: —
- [x] **T002** — Ver la oficina: lienzo con la oficina grande en perspectiva, 8 salas chicas en
      orden (cartel con número y comando, pizarra, escritorio), lobby central con el cartel del
      modelo, papelería y 8 personajes de bloques. Crea: `app/src/oficina/`, `app/src/ui/`. · US: US-1
- [x] **T003** — Decorar la oficina como la foto de referencia: plantas, sillón, bebedero, sala de
      reuniones de vidrio para el review y paleta definida. Toca: `app/src/oficina/`. · US: US-1
- [x] **T004** — Mover la cámara: desplazar con clic derecho arrastrando y zoom con la rueda, sobre
      una oficina más grande que la pantalla. Crea: cámara en `app/src/oficina/`. · US: US-2
- [x] **T005** — Dejar el brief en la papelería: el brief de ejemplo queda ahí y habilita al
      agente 1. Crea: `app/src/flujo/`, brief en `app/src/contenido/`. · US: US-3
- [x] **T006** — Ordenar correr: con el agente habilitado, animación corta y globito que explica
      qué hace. Toca: `flujo/`, `oficina/`, `ui/`. · US: US-4
- [x] **T007** — Leer lo que produjo: documento simplificado de cada agente sobre su escritorio,
      que se abre y se cierra. Crea: documentos en `app/src/contenido/`. · US: US-5
- [x] **T008** — Avanzar en orden: el brief pasa al siguiente agente, solo ese se habilita y
      ninguno corre solo. Toca: `flujo/`, `oficina/`. · US: US-6
- [x] **T009** — Pantalla final con el repaso de los pasos y botón "Jugar de nuevo" que reinicia.
      Crea: pantalla final en `app/src/ui/`. · US: US-7
- [x] **T010** — Música chill generada con el sonido del navegador, que arranca con el primer
      clic y se puede silenciar. Crea: `app/src/musica/`. · US: US-8
- [x] **T011** — Textos simples: revisar que cada agente diga qué hace, para qué sirve y qué
      produjo, sin jerga sin explicar (con test sobre el contenido). Toca: `contenido/`. · US: US-9
- [x] **T012** — Cierre: `pnpm test` en verde, `pnpm audit:sdd` sin FAIL y recorrido completo
      del juego en `localhost:5173`. · US: —
