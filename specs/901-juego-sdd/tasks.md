# Tasks — 901-juego-sdd (Juego del modelo operativo)

Cada task es un corte vertical. TDD: tests primero. Sin nombres de funciones.

- [ ] **T001** — Scaffold: app React con TypeScript y Vite en `app/`, puerto fijo 5173, Vitest, y
      `pnpm dev` / `pnpm test` funcionando con una pantalla vacía. Crea: `app/`. · US: —
- [ ] **T002** — Ver la oficina: lienzo con la papelería, 8 escritorios en orden con el nombre de
      su comando y 8 personajes de bloques dibujados en código. Crea: `app/src/oficina/`,
      `app/src/ui/`. · US: US-1
- [ ] **T003** — Mover la cámara: desplazar con clic derecho arrastrando y zoom con la rueda.
      Crea: cámara en `app/src/oficina/`. · US: US-2
- [ ] **T004** — Dejar el brief en la papelería: el brief de ejemplo queda ahí y habilita al
      agente 1. Crea: `app/src/flujo/`, brief en `app/src/contenido/`. · US: US-3
- [ ] **T005** — Ordenar correr: con el agente habilitado, animación corta y globito que explica
      qué hace. Toca: `flujo/`, `oficina/`, `ui/`. · US: US-4
- [ ] **T006** — Leer lo que produjo: documento simplificado de cada agente sobre su escritorio,
      que se abre y se cierra. Crea: documentos en `app/src/contenido/`. · US: US-5
- [ ] **T007** — Avanzar en orden: el brief pasa al siguiente agente, solo ese se habilita y
      ninguno corre solo. Toca: `flujo/`, `oficina/`. · US: US-6
- [ ] **T008** — Pantalla final con el repaso de los pasos y botón "Jugar de nuevo" que reinicia.
      Crea: pantalla final en `app/src/ui/`. · US: US-7
- [ ] **T009** — Música chill generada con el sonido del navegador, que arranca con el primer
      clic y se puede silenciar. Crea: `app/src/musica/`. · US: US-8
- [ ] **T010** — Textos simples: revisar que cada agente diga qué hace, para qué sirve y qué
      produjo, sin jerga sin explicar (con test sobre el contenido). Toca: `contenido/`. · US: US-9
- [ ] **T011** — Cierre: `pnpm test` en verde, `pnpm audit:sdd` sin FAIL y recorrido completo
      del juego en `localhost:5173`. · US: —
