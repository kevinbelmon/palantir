# Plan — 901-juego-sdd (Juego del modelo operativo)

Modo greenfield. `source_root`: `app/` (el scaffold vive en subcarpeta; `specs/`, `metrics/` y
`graph/` siguen siendo hermanos en la raíz del repo).

## Stack (versiones fijas al instalar)

React · TypeScript · Vite · Vitest (solo desarrollo, para TDD y `pnpm test`). Gestor: `pnpm`.
Sin motores de juego, sin librerías de audio, sin recursos externos.

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
contenido/   textos, globitos y documentos simplificados de cada agente, y el brief de ejemplo
musica/      música chill generada con el sonido del navegador (partitura pura + reproductor)
ui/          componentes React: lienzo, globito, visor de documento, pantalla final, silenciar
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
- Contenido en español simple para los 8 agentes: globito, qué hace, para qué sirve y documento.
- Visor de documento, pantalla final con repaso y botón "Jugar de nuevo".
- Música ambiente chill con botón de silenciar, que arranca tras el primer clic.

Referencia visual: `drafts/referencia-oficina.png` (solo guía); la paleta se define en T002.
