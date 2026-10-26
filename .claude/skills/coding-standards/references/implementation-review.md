# Implementation and review

Fuentes principales:
- `.claude/commands/sdd-implement.md`
- `.claude/commands/sdd-review.md`

## Implementación

- Seguir el orden de tareas y respetar gates previos.
- Priorizar cambios mínimos y trazables.
- Evitar duplicaciones si ya existe responsabilidad equivalente en el código.

## Calidad del código generado

Aplica al código que el modelo genera/modifica en el codebase objetivo, no a los
artefactos del framework. Es el default; si `existing-arch.md` o una convención real
del repo dice otra cosa, manda el repo y la divergencia se registra en `DECISIONS.md`
vía `/sdd-log`. Adaptá al lenguaje del proyecto.

- **Parámetros seguros.** Si una función recibe varios parámetros del mismo tipo
  primitivo (intercambiables sin que el compilador lo note), agrupalos en un objeto o
  estructura con nombres en vez de posicionales. No aplica a firmas de interfaz pública
  fijadas en `plan.md`, ni cuando lo posicional es más claro (un parámetro, o tipos
  distintos y evidentes).
- **Manejo de errores.** Identificá los errores posibles de cada operación y manejalos
  con el mecanismo que ya usa el repo (excepciones, Result, códigos). No ocultes fallos
  ni devuelvas un resultado "exitoso" cuando la operación falló. Evitá `try/catch` que
  no aporten recuperación, contexto o traducción del error.

## Review

- Validar lógica (spec/tests) y UI (input/spec/código).
- Verificar los puntos de "Calidad del código generado" (parámetros seguros, manejo de
  errores) y reportar incumplimientos como gaps con evidencia.
- Si hay gaps, reportar explícitamente y no cerrar en falso.
- Usar lenguaje de evidencia: criterio, archivo, resultado.
