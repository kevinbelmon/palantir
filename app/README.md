# La oficina del modelo operativo

Un juego en el navegador para que cualquier persona, sin saber programar, entienda el paso a paso
del modelo operativo (SDD Model v1.1). Una oficina con 8 agentes, uno por comando del camino
principal; el brief viaja de sala en sala y la persona le ordena a cada agente que corra.

## Cómo se usa

```
pnpm install
pnpm dev
```

Abrí `http://localhost:5173`. Música y todo lo demás se activan con el primer clic.

- **Mover la oficina:** mantené el clic derecho y arrastrá. **Acercar o alejar:** la rueda.
- **Jugar:** dejá el brief en la papelería, tocá al agente 1, ordenale correr, leé lo que produjo, y seguí con el siguiente.

El puerto 5173 es fijo. Si otra aplicación lo está usando, el juego **no arranca** y avisa
(`Port 5173 is already in use`): cerrá esa aplicación o elegí otro puerto con `pnpm dev --port 5180`.

## Para quien desarrolla

| Comando | Qué hace |
|---|---|
| `pnpm test` | corre todos los tests |
| `pnpm typecheck` | revisa los tipos |
| `pnpm lint` | revisa el estilo del código |
| `pnpm build` | arma la versión final en `dist/` |

Solo se usa React, Vite y, para las pruebas, Vitest. No hay motores de juego, ni librerías de audio,
ni imágenes, fuentes o sonidos externos: la oficina, los personajes y la música se generan en código.

## Cómo está organizado (`src/`)

| Carpeta | Qué tiene |
|---|---|
| `flujo/` | el estado del juego: los 8 agentes, el brief y qué se habilita en cada paso |
| `oficina/` | el mapa, el dibujo en el lienzo, la cámara y qué hay bajo el mouse |
| `contenido/` | todos los textos: globitos, documentos, guía y el brief de ejemplo |
| `musica/` | la música chill: partitura y reproductor |
| `ui/` | los componentes de la pantalla |

Los textos que lee la persona están en `contenido/` y un test revisa que no tengan jerga técnica.
