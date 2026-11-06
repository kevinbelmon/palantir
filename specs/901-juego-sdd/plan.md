# Plan — 901-juego-sdd (Juego del modelo operativo)

Modo greenfield. `source_root`: `app/` (el scaffold vive en subcarpeta; `specs/`, `metrics/` y
`graph/` siguen siendo hermanos en la raíz del repo).

## Stack (versiones fijas al instalar)

React · TypeScript · Vite · Three.js (solo para dibujar el mundo en 3D) · Vitest (solo desarrollo,
para TDD y `pnpm test`). Gestor: `pnpm`. Sin motores de juego ni de física, sin librerías de audio,
sin recursos externos.

## Scaffold

```
pnpm create vite@latest app -- --template react-ts
```

`vite.config` fija `localhost:5173` con puerto estricto (si está ocupado, falla con aviso).

## Estructura (por capacidad, dentro de `app/src/`)

```
flujo/       estado del juego: 8 agentes en orden, brief, desbloqueos, avance (lógica pura)
oficina/     mapa grande en perspectiva: 8 salas, lobby, papelería, muebles y personajes
             dibujados en el lienzo; animaciones; cámara (desplazar y zoom: cuentas + dibujo)
escena/      mundo en 3D con Three.js: bloques, personajes, luces, cámara 3D y selección con el mouse
             (la oficina en 2D de `oficina/` queda de respaldo si el navegador no puede mostrar 3D)
contenido/   textos, globitos y documentos simplificados de cada agente, y el brief de ejemplo
musica/      música chill generada con el sonido del navegador (partitura pura + reproductor)
ui/          componentes React: lienzo, «Paso a paso», visor, pantalla final, música, íconos
app/tests/   un archivo de test por capacidad
```

Cada capacidad expone una interfaz pública chica; `ui/` y `oficina/` no importan internals de
`flujo/` ni de `contenido/`. Dibujo y estado no se mezclan: el lienzo solo pinta lo que `flujo/`
y `oficina/` calculan.

## Componentes a crear

- Estado del juego: papelería → agente 1 … agente 8 → fin, con "corriendo" y "terminado".
- Oficina grande en perspectiva: 8 salas (cartel, pizarra, escritorio, personaje), lobby, papelería.
- Cámara: desplazar con clic derecho arrastrando; zoom con la rueda.
- Ruta del brief con flechas, vida de los personajes, objetos por sala y barra superior con el paso.
- Estilo de bloques (tacos y ladrillos), etiquetas con el comando y dock con los 8 agentes.
- Mundo 3D: piso con tacos, ladrillos, luces y sombras, muñecos y objetos de bloques, cámara 3D.
- Contenido en español simple para los 8 agentes: globito, qué hace, para qué sirve y documento.
- Visor de documento, pantalla final con repaso y botón "Jugar de nuevo".
- Música ambiente chill con botón de silenciar, que arranca tras el primer clic.
- Panel lateral «Paso a paso» (frase corta por comando) y barra, botón y carteles sin emojis.

