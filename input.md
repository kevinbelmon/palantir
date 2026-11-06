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

## OUT OF SCOPE (v1)
- Puntaje o ranking.
- Guardar la partida.
- Otros idiomas.
- Celular y pantalla táctil.
- Comandos fuera del camino principal (por ejemplo `/sdd-fix`, `/sdd-health`, `/sdd-scan`).
- Que la persona maneje un personaje o escriba su propio brief.
- Efectos de sonido: solo hay música de fondo.
- Login, cuentas, servidor o base de datos.

## RESTRICCIONES TÉCNICAS
- React con TypeScript y Vite, que se levanta con `pnpm dev` en `localhost:5173` (puerto por
  defecto de Vite, configurable).
- Mapa con el lienzo 2D del navegador, sin motores de juego. Lo único que se instala es React y
  Vite.
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
(lista de verificación) y review (verificación final). Referencia visual: la foto en
`drafts/referencia-oficina.png`; los colores y detalles los define `/sdd-generate`.
