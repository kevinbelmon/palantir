Publicá el estado de este repo en el tablero central.

```bash
pnpm sdd:publish --central <org/repo>
```

Si `SDD_ESTADO_REPO` está en el entorno, `--central` sobra.

El script hace cuatro cosas en orden, y no hace falta correr ninguna a mano:
auditor con `--json` (el veredicto describe *este* árbol), `sdd-tokens` (consumo
real vía ccusage), `sdd-state` (escribe `metrics/estado.json`) y el push.

**Gate (lo verifica el script, no vos):** el registro necesita `meta.repo` y
`meta.proyecto_id` en `specs/_registry/features.yaml`. Sin los dos se niega a
publicar — un archivo anónimo en un repo compartido entre clientes no se puede
atribuir ni limpiar. El `proyecto_id` lo escribe `/sdd-generate` cuando llega un
brief de Discovery; `meta.repo` lo declara el equipo y **no se deduce** del
nombre de la carpeta ni del repositorio (`contracts/paths.md` §0).

**Qué se publica:** identificadores, estados y conteos. Ni una línea de spec,
plan o decisión: el documento sale del repo hacia un central compartido.

**Cuándo tiene sentido:** al cerrar una feature, o cuando quieras que el tablero
refleje el estado de ahora. Publicar dos veces sin cambios no hace nada — el
script compara contra lo publicado ignorando las marcas de tiempo y no commitea
si el estado no se movió.

## Si falla

**"repository not found"** — casi siempre es falta de permiso, no un repo
inexistente: GitHub responde 404 en vez de 403 para no revelar que existe. Pedí
acceso de escritura al central. No inventes otro nombre de repo ni sugieras
crearlo.

**"falta meta.repo"** — no lo completes por tu cuenta. Preguntá al equipo con
qué identidad se declara este codebase.

**El auditor en rojo no frena la publicación**, y es deliberado: un repo con
FAIL es justo el que el tablero necesita ver. Si solo se publicara en verde, el
tablero mostraría únicamente los proyectos sanos.

Empezá directamente, sin pedir confirmación.
