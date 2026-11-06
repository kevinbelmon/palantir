# Constitución — 901-juego-sdd (Juego del modelo operativo)

Principios no negociables. Si algo choca con ellos, se registra con `/sdd-log` antes de seguir.

## MUST

1. **La persona manda en cada paso.** Ningún agente corre solo: cada uno corre cuando se lo ordena.
2. **Orden fijo de 8 agentes:** refine, generate, validate, log, implement, e2e, checklist, review.
   El brief solo llega al siguiente cuando el anterior terminó.
3. **El brief empieza en la papelería.** Hasta que no se deja ahí, el agente 1 está deshabilitado.
4. **El jugador mueve solo la cámara:** clic derecho arrastrando para desplazar, rueda para el zoom.
   No controla ningún personaje.
5. **Un solo brief de ejemplo, siempre el mismo** ("una app para dividir gastos entre amigos").
6. **Español simple.** Todo texto se entiende sin saber programar; si aparece una palabra técnica,
   se explica en la misma frase.
7. **Lógica separada del dibujo.** El avance del juego, la cámara, el contenido y la música tienen
   su lógica pura, testeable sin navegador; el lienzo solo dibuja lo que esa lógica dice.
8. **Contenido en un solo lugar.** Textos, globitos y documentos de cada agente viven juntos y se
   editan sin tocar el motor del juego.
9. **Música generada por el propio juego**, tranquila y chill. Arranca con el primer clic de la
   persona y siempre se puede silenciar.
10. **TDD.** Los tests van antes de la implementación; `pnpm test` en verde para cerrar una task.
11. **Puerto fijo:** `localhost:5173` con `pnpm dev`. Si está ocupado, falla con un aviso claro.

## PROHIBITED

1. **Motores o librerías de juego** (Phaser, Pixi y similares) y **librerías de audio**. Solo
   React, Vite y, como herramienta de desarrollo, Vitest.
2. **Descargar o incluir recursos externos:** imágenes, fuentes, audio, sprites. Tampoco arte de
   Roblox: los personajes se dibujan en código, con estilo propio.
3. **Dependencias nuevas fuera de `plan.md`.** Cada paquete va con versión fija.
4. **Avance automático** del brief o de los agentes.
5. **Efectos de sonido:** solo hay música de fondo.
6. **Servidor, base de datos, login o cuentas.** El juego corre entero en el navegador.
7. **Guardar la partida o un puntaje.**
8. **Jerga técnica sin explicar** en cualquier texto que vea la persona.
9. **Inventar arquitectura** que no esté en `plan.md`, o mover las carpetas del modelo
   (`specs/`, `metrics/`, `graph/`, `drafts/`).
10. **Tocar capa A** (`.claude/`, `scripts/`, `contracts/`) desde esta feature.

## Alcance de rigor

- Idioma de la interfaz: español. Solo computadora con mouse.
- Los documentos que "produce" cada agente son simplificaciones didácticas del ejemplo de gastos
  entre amigos; no son salidas reales del modelo.
