# Juego del modelo operativo — SDD Model v1.1

feature_id: 901-juego-sdd

## PROBLEMA
Las personas que no programan no entienden qué es el modelo operativo (SDD Model v1.1) ni en qué
orden se hacen sus pasos. El juego se los explica recorriendo el paso a paso, con muñequitos en
una oficina.

## USUARIO
Una persona que no entiende de programación. No maneja ningún personaje: mueve solo la cámara,
deja el brief y le ordena a cada agente que corra. Aprende mirando qué hace y qué produce cada
paso. No hay cuentas ni login.

## DONE CRITERIA
1. Se abre en `http://localhost:5173` con `pnpm dev` y se ve una oficina grande, más grande que la
   pantalla, con la papelería, un lobby central y 8 salas chicas, una por agente y en orden (refine,
   generate, validate, log, implement, e2e, checklist y review), como en `drafts/referencia-oficina.png`.
2. La cámara se desplaza con clic derecho arrastrando y se acerca o aleja con la rueda del mouse.
3. El brief de ejemplo se deja en la papelería, y recién ahí se habilita al agente 1.
4. Cada agente corre solo cuando la persona se lo ordena, nunca solo. Al terminar deja sobre su
   escritorio un documento simplificado que se puede abrir y leer.
5. El brief solo llega al siguiente agente cuando el anterior terminó.
6. Al terminar el último agente aparece una pantalla final que repasa los pasos, con un botón
   para jugar de nuevo.
7. Todos los textos están en español y en palabras simples: quien no programa entiende qué hace
   cada agente.
8. Suena una música tranquila y chill de fondo, generada por el propio juego. Arranca con el
   primer clic y tiene un botón para silenciarla.
9. `pnpm test` en verde y `pnpm audit:sdd` sin FAIL.
10. La oficina tiene vida: una ruta con flechas marca por dónde viaja el brief, los personajes se
    mueven aunque nadie los toque y una barra superior muestra en qué paso va la persona. Si el
    sistema pide menos movimiento, todo queda quieto.
11. Todo parece armado con bloques que se encastran (piso con tacos, paredes de ladrillos blancos,
    muebles y personajes de bloques). Sobre cada personaje flota una etiqueta con el nombre de su
    comando y su estado, y abajo hay un dock con los 8 agentes, cuántas tareas faltan y a quién le
    toca. Al tocar un agente, la cámara viaja a su sala.
12. El mundo se ve en 3D real, con perspectiva, luces y sombras, como un render de bloques; la
    cámara se desplaza con el clic derecho y se acerca con la rueda. Si el navegador no puede
    mostrar 3D, se ve la oficina en 2D.
13. A la izquierda hay un panel «Paso a paso» con los 8 comandos en orden y su estado. Al tocar uno,
    la cámara viaja a su sala y aparece una explicación corta (una frase) de para qué sirve.
14. La barra de arriba, el botón de música y los carteles se ven modernos y limpios: sin emojis
    (el cohete, el parlante, la hoja); los íconos y el logo se dibujan en código.

## OUT OF SCOPE (v1)
- Puntaje o ranking.
- Guardar la partida.
- Otros idiomas.
- Celular y pantalla táctil.
- Comandos fuera del camino principal (por ejemplo `/sdd-fix`, `/sdd-health`, `/sdd-scan`).
- Que la persona maneje un personaje o escriba su propio brief.
- Efectos de sonido: solo hay música de fondo.
- Login, cuentas, servidor o base de datos.
- Menú de Inicio, Mi Juego, Analytics y Configuración, repositorio por persona y cuenta de Claude:
  son una feature aparte (902). El panel «Paso a paso» sí entra.
- Marcas, logos, nombres o personajes de otras obras: el estilo de bloques es propio y genérico.

## RESTRICCIONES TÉCNICAS
- React con TypeScript y Vite, que se levanta con `pnpm dev` en `localhost:5173` (puerto por
  defecto de Vite, configurable).
- El mundo se dibuja en 3D con Three.js (versión fija), sin motores de juego ni de física. Si el
  navegador no puede mostrar 3D, se usa la oficina en 2D. Lo único que se instala es React, Vite,
  Three.js y, para las pruebas, Vitest.
- La música se genera con el sonido del propio navegador: sin archivos de audio ni descargas.
- Personajes, salas y muebles dibujados por nosotros en el lienzo, con formas simples de bloques y
  estilo propio parecido a Roblox. La foto de referencia es solo una guía: no se incluye en el
  juego, y no se usa arte de Roblox ni ningún recurso externo.
- Solo en computadora, con mouse. Gestor de paquetes: `pnpm`.

## UI / FLUJO
Oficina grande vista desde arriba en perspectiva, como en `drafts/referencia-oficina.png`: 8 salas
chicas, una por agente, alrededor de un lobby central con el cartel «Spec-Driven Development —
Planear primero. Construir después.», un sillón y plantas. Cada sala tiene su cartel con número y
nombre del comando, una pizarra con lo que hace, un escritorio con compu, plantas y su personajito
de bloques. Las salas 1 a 4 van arriba (refine, generate, validate, log), la 5 a la 7 abajo
(implement, e2e, checklist) y la 8 (review) es una sala de reuniones de vidrio a la derecha. La
papelería es una zona propia junto al lobby. Flujo: la persona deja el brief de ejemplo en la papelería ("una app para
dividir gastos entre amigos", siempre el mismo) → se habilita al agente 1 → la persona le ordena
que corra → el agente trabaja con una animación corta, explica en un globito qué hace y deja un
documento simplificado que se puede abrir → el brief pasa al agente siguiente → se repite hasta el
agente 8 → pantalla final. Documentos de cada agente, simplificados con el ejemplo: refine (el
brief pulido), generate (los documentos de especificación), validate (reporte de huecos), log (el
registro de la decisión), implement (código y tests), e2e (evidencia de las pruebas), checklist
(lista de verificación) y review (verificación final). Referencia visual: las fotos en
`drafts/referencia-oficina.png` y `drafts/referencia-oficina-2.png`; los colores y detalles los define
`/sdd-generate`. La oficina tiene vida: una ruta con flechas muestra por dónde viaja el brief (lo
hecho en verde, lo que sigue en amarillo), los personajes respiran y parpadean, cada sala tiene
objetos propios de lo que hace su agente, y una barra superior muestra el título y el paso en que va
la persona. Tercera referencia (una captura de una oficina armada con ladrillos de juguete; no se
guarda en el repositorio por ser de terceros): piso gris con tacos, paredes de ladrillos blancos,
muñecos de bloques, una etiqueta flotante sobre cada uno con su nombre y un punto de estado (verde,
amarillo), y un dock abajo con el avatar de cada uno, un número rojo cuando algo le espera, un
botón «Nuevo» y los contadores «Tareas» y «Te toca». Acá las etiquetas llevan el nombre de cada
comando. Pedido posterior: más realidad, así que el mundo pasa a verse en 3D de verdad. Otro pedido: un panel
lateral «Paso a paso» (los 8 comandos, un toque explica para qué sirve en una frase corta), y quitar
el aspecto «Windows XP» (emojis y degradé brillante) de la barra de arriba, el botón de música y los
carteles: logo e íconos dibujados en código, estilo plano y moderno.
