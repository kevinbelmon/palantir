# Spec — 901-juego-sdd (Juego del modelo operativo)

Usuario: una persona que no programa. Mueve la cámara, deja el brief y ordena correr a cada agente.

## User stories

**US-1 — Ver la oficina**
- Dado que abro `localhost:5173`, cuando carga, entonces veo una oficina grande en 3D real, con
  luces y sombras: papelería, lobby central y 8 salas en orden, cada una con su cartel con el
  comando, pizarra, escritorio y personajito.
- Salas 1 a 4 arriba, 5 a 7 abajo y la 8 (review) de vidrio a la derecha; en el centro, el cartel
  «Spec-Driven Development». Si el navegador no puede mostrar 3D, veo la oficina en 2D.

**US-2 — Mover la cámara**
- Dado que miro la oficina, con el clic derecho arrastrando se desplaza, y con la rueda se acerca o aleja.

**US-3 — Dejar el brief en la papelería**
- Dado el agente 1 deshabilitado, cuando dejo el brief de ejemplo en la papelería, se habilita.

**US-4 — Ordenar correr a un agente**
- Dado un agente habilitado, cuando le ordeno correr, entonces trabaja con una animación corta y
  un globito explica en palabras simples qué está haciendo.

**US-5 — Leer lo que produjo**
- Dado que un agente terminó, cuando abro el documento sobre su escritorio, entonces leo la versión
  simplificada de lo que produjo (con el ejemplo de gastos entre amigos) y lo puedo cerrar.
- Cada agente deja el suyo, distinto: del brief pulido (refine) a la verificación final (review).

**US-6 — Avanzar en orden**
- Dado que un agente terminó, cuando el brief pasa al siguiente, entonces solo ese se habilita;
  los demás siguen deshabilitados y ninguno corre sin que yo se lo ordene.

**US-7 — Terminar el recorrido**
- Dado que el agente 8 terminó, cuando se cierra su documento, aparece una pantalla final con el
  repaso y un botón para jugar de nuevo.

**US-8 — Música chill**
- Dado que hago el primer clic, suena una música tranquila y chill, y la puedo silenciar y volver
  a activar con un botón.

**US-9 — Textos que cualquiera entiende**
- Dado cualquier agente, cuando leo su globito y su documento, entiendo qué hizo sin saber
  programar: dice qué hace, para qué sirve y qué produjo, sin jerga sin explicar.

**US-10 — Una oficina con vida**
- Dado que el brief avanza, entonces una ruta con flechas muestra por dónde viaja (lo hecho en
  verde, lo que sigue en amarillo), los personajes se mueven aunque nadie los toque y una barra
  superior dice en qué paso voy.
- Dado que mi sistema pide menos movimiento, nada se anima.

**US-11 — Un mundo de bloques con etiquetas y dock**
- Dado que miro la oficina, entonces todo parece armado con bloques (piso con tacos, paredes de
  ladrillos, muebles y personajes) y sobre cada personaje flota una etiqueta con el nombre de su
  comando y su estado.
- Dado que miro abajo, cuando uso el dock, veo a los 8 agentes con su estado, cuántas tareas
  faltan y a quién le toca, y al tocar uno la cámara viaja a su sala.

**US-12 — Paso a paso en un panel lateral**
- Dado que miro el juego, cuando carga, entonces a la izquierda veo «Paso a paso» con los 8
  comandos en orden y su estado; al tocar uno, la cámara viaja a su sala y se despliega una frase
  corta sobre para qué sirve.

**US-13 — Aspecto moderno, sin emojis**
- Dado que miro la barra de arriba, el botón de música y los carteles, entonces no hay emojis: el
  logo y los íconos están dibujados en código, con un estilo plano y limpio.

## Fuera de scope (v1)

- Puntaje, ranking, guardar la partida, otros idiomas, celular y pantalla táctil — no pedidos.
- Comandos fuera del camino principal (`/sdd-fix`, `/sdd-health`, `/sdd-scan`…) — "por ahora".
- Que la persona maneje un personaje o escriba su brief; efectos de sonido (solo hay música).
- Login, cuentas, servidor o base de datos — el juego corre en el navegador.
- Menú de Inicio/Analytics/Configuración, repo por persona y cuenta de Claude — feature 902.
- Marcas, logos, nombres o personajes de otras obras — el estilo de bloques es propio.
- Motores de juego o de física — la única librería de dibujo es Three.js.

## Measurable Process Outcomes (DX)

- **DX-001**: menos de 3 ciclos de autocorrección (Rework) por task.
- **DX-002**: densidad de ambigüedad en 0 — sin consultas de aclaración para la IA.
