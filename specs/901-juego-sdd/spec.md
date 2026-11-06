# Spec — 901-juego-sdd (Juego del modelo operativo)

Usuario: una persona que no programa. Mueve la cámara, deja el brief y ordena correr a cada agente.

## User stories

**US-1 — Ver la oficina**
- Dado que abro `localhost:5173`, cuando carga el juego, entonces veo una oficina grande desde
  arriba, en perspectiva, con la papelería, un lobby central y 8 salas chicas en orden; cada sala
  tiene su cartel con el comando, su pizarra, su escritorio y su personajito.
- Las salas 1 a 4 (refine, generate, validate, log) van arriba, la 5 a la 7 (implement, e2e,
  checklist) abajo, y la 8 (review) es una sala de vidrio a la derecha; en el centro está el
  cartel «Spec-Driven Development — Planear primero. Construir después.».

**US-2 — Mover la cámara**
- Dado que miro la oficina, cuando mantengo el clic derecho y arrastro, entonces el mapa se
  desplaza; y cuando giro la rueda, se acerca o se aleja.

**US-3 — Dejar el brief en la papelería**
- Dado que el agente 1 está deshabilitado, cuando dejo el brief de ejemplo en la papelería,
  entonces el brief queda ahí y el agente 1 se habilita.

**US-4 — Ordenar correr a un agente**
- Dado un agente habilitado, cuando le ordeno correr, entonces trabaja con una animación corta y
  un globito explica en palabras simples qué está haciendo.

**US-5 — Leer lo que produjo**
- Dado que un agente terminó, cuando abro el documento sobre su escritorio, entonces leo la versión
  simplificada de lo que produjo (con el ejemplo de gastos entre amigos) y lo puedo cerrar.
- Cada agente deja el suyo: refine, el brief pulido; generate, los documentos de especificación;
  validate, el reporte de huecos; log, el registro de la decisión; implement, código y tests; e2e,
  la evidencia de las pruebas; checklist, la lista de verificación; review, la verificación final.

**US-6 — Avanzar en orden**
- Dado que un agente terminó, cuando el brief pasa al siguiente, entonces solo ese se habilita;
  los demás siguen deshabilitados y ninguno corre sin que yo se lo ordene.

**US-7 — Terminar el recorrido**
- Dado que el agente 8 terminó, cuando se cierra su documento, entonces aparece una pantalla final
  que repasa los pasos, con un botón para jugar de nuevo que reinicia todo.

**US-8 — Música chill**
- Dado que hago el primer clic, cuando el juego arranca el sonido, entonces suena una música
  tranquila y chill, y puedo silenciarla y volver a activarla con un botón.

**US-9 — Textos que cualquiera entiende**
- Dado cualquier agente, cuando leo su globito y su documento, entonces entiendo qué hizo sin
  saber programar: dice qué hace, para qué sirve y qué produjo, sin jerga sin explicar.

**US-10 — Una oficina con vida**
- Dado que miro la oficina, cuando el brief avanza, entonces una ruta con flechas muestra por dónde
  viaja (lo hecho en verde, lo que sigue en amarillo), los personajes se mueven aunque nadie los
  toque y una barra superior dice en qué paso voy.
- Dado que mi sistema pide menos movimiento, cuando abro el juego, entonces nada se anima.

**US-11 — Un mundo de bloques con etiquetas y dock**
- Dado que miro la oficina, cuando carga, entonces todo parece armado con bloques que se encastran
  (piso con tacos, paredes de ladrillos, muebles y personajes) y sobre cada personaje flota una
  etiqueta con el nombre de su comando y su estado.
- Dado que miro abajo, cuando uso el dock, entonces veo a los 8 agentes con su estado, cuántas
  tareas faltan y a quién le toca, y al tocar uno la cámara viaja a su sala.

## Fuera de scope (v1)

- Puntaje o ranking — no pedido.
- Guardar la partida — no pedido.
- Otros idiomas — v1 es solo en español.
- Celular y pantalla táctil — v1 es solo computadora con mouse.
- Comandos fuera del camino principal (`/sdd-fix`, `/sdd-health`, `/sdd-scan`…) — "por ahora".
- Que la persona maneje un personaje o escriba su propio brief — el brief es fijo.
- Efectos de sonido — solo hay música de fondo.
- Login, cuentas, servidor o base de datos — el juego corre en el navegador.
- Menú lateral, repositorio por persona y cuenta de Claude — feature aparte (902).
- Marcas, logos, nombres o personajes de otras obras — el estilo de bloques es propio.

## Measurable Process Outcomes (DX)

- **DX-001**: el agente completa la implementación con menos de 3 ciclos de autocorrección
  (Rework) por task.
- **DX-002**: densidad de ambigüedad en 0 — sin consultas de aclaración para la IA.
