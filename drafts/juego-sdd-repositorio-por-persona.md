# Repositorio por persona y cuenta de Claude (feature 902, a refinar)

Notas de lo que pidió el equipo. Borrador crudo: todavía no está refinado con `/sdd-refine`.

Este borrador sigue al de `juego-sdd-idea.md` (la oficina del modelo operativo, feature 901, ya
implementada). Lo de acá es **otra feature**: no se mezcla con la 901.

## Lo que se pidió

- Que a cada persona que usa el juego se le **cree un repositorio** (o lo cree ella) y se le
  **clone el modelo SDD**, y que **ahí corra el juego**.
- Que cada persona **conecte su cuenta de Claude**, para que se vean sus **tokens**.
- Que se vea **real**: no una simulación, sino de verdad.
- Es una **página publicada**, que por ahora se **prueba en local**.

## Cómo se imagina que se ve (segunda foto, `drafts/referencia-oficina-2.png`)

- Una **barra de arriba** con el nombre del modelo, un estado ("Todo en orden"), el usuario y dos
  chips: "Claude conectado" y "GitHub conectado".
- Un **menú lateral** con: Inicio, Mi Juego, Analytics, Configuración y Ayuda.
- Un panel **"Tu Repositorio"** con la dirección del repo, el aviso "Repo creado y clonado", un botón
  "Abrir en VS Code", y tres tildes: "SDD instalado", "Cuenta de Claude conectada" y "Tokens
  leídos" (con la cantidad).
- Un aviso de bienvenida abajo ("¡Listo para empezar! Tu entorno está preparado").

Los números de esa foto (tokens, uptime, costo) son de ejemplo.

## Cosas que quedaron planteadas y hay que decidir

- Una página publicada no puede clonar nada en la computadora de la persona ni leer sus archivos:
  hay que decidir qué significa "clonar" y dónde corre el juego de cada persona.
- GitHub: cómo inicia sesión la persona y qué puede hacer la página en su nombre (crear un repo es
  una acción hacia afuera).
- Claude: no hay una forma pública de conectar una cuenta personal y leer sus tokens; el consumo que
  usa hoy el modelo sale de los registros locales de Claude Code (`ccusage`). Hay que decidir de
  dónde sale el número "real".
- Requiere un servidor y cuentas, que la feature 901 deja explícitamente afuera.

## Respuestas ya dadas en el refine (2026-11-06)

- El juego conecta con el repo desde adentro de la página: se crea un repositorio vacío y se copia
  ahí el brief y todos los comandos del modelo.
- Iniciar sesión con GitHub: sí, con el botón «Autorizar» de GitHub (la persona autoriza una vez;
  en el juego no se escribe ninguna contraseña ni token). Falta decidir el resto de las categorías.
- Conexión al repo (decidido): la persona **pega el link de un repo que ya existe**; un programa
  local (corre en su compu junto al juego) guarda el brief que escribió en `drafts/` y sube ahí el
  brief y el modelo con el `git` que ya tiene autenticado. Sin contraseñas ni tokens en el juego, y
  sin botón «Autorizar» ni creación de repos en esta versión (reemplaza la respuesta anterior).
- El brief ya no es fijo en esta feature: lo escribe o carga la persona.
