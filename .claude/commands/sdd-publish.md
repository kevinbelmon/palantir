Publicá el estado de este repo en el tablero central.

```bash
pnpm sdd:publish --central <org/repo>
```

Si `SDD_ESTADO_REPO` está en el entorno, `--central` sobra.

El script hace cuatro cosas en orden, y no hace falta correr ninguna a mano:
auditor con `--json` (el veredicto describe *este* árbol), `sdd-tokens` (consumo
real vía ccusage), `sdd-state` (escribe `metrics/estado.json`) y el push.

**Confirmación antes de pushear (obligatoria, vos la hacés — el script no):**
Antes de correr el publish, mostrale al dev la identidad con la que va a salir y
esperá su OK. Sacá los valores con:

```bash
node scripts/sdd-state.mjs --root . --stdout
```

y leé `source` del JSON. Mostrá exactamente esto:

```
Voy a publicar el estado de este codebase como:
    proyecto:  <source.proyecto_id>
    codebase:  <source.repo>   (del repo git: <source.git.host>/<source.git.path>)
    destino:   <central> → estado/<proyecto_id>/<source.repo>.json
¿Confirmás? (sí / no)
```

- **`source.repo` es el nombre del repo git, derivado de `origin`** — no se
  escribe a mano. Si al dev no le cierra, el arreglo es corregir el remote del
  repo, no un campo del registro.
- Si `source.repo` sale `null`, el codebase no es un repo git o no tiene remote
  `origin`: **pará y avisá**, no se puede publicar sin identidad.
- En un monorepo el archivo lleva el `subdir` como sufijo
  (`<repo>__<subdir>.json`) para que los codebases del mismo repo no se pisen.
- Solo con el "sí" explícito corré el publish. Este paso es del flujo
  interactivo; el job de CI publica sin preguntar (no hay dev a quién preguntarle).

**Gate (lo verifica el script, no vos):** sin `source.repo` (no hay repo git) o
sin `meta.proyecto_id`, el script se niega a publicar — un archivo anónimo en un
repo compartido entre clientes no se puede atribuir ni limpiar. El `proyecto_id`
lo escribe `/sdd-generate` cuando llega un brief de Discovery.

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

**"falta un remote git origin"** — el codebase no es un repo o no tiene `origin`.
La identidad sale de ahí: sin remote no hay a quién atribuir el estado. No lo
suplas con un nombre inventado.

**El auditor en rojo no frena la publicación**, y es deliberado: un repo con
FAIL es justo el que el tablero necesita ver. Si solo se publicara en verde, el
tablero mostraría únicamente los proyectos sanos.
