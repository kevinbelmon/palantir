# Changelog — framework SDD

Una sección por versión de `.claude/VERSION`. La semántica de los bumps
(MAJOR / MINOR / PATCH) está en `contracts/framework.md` §4.

Regla de oro: **si un repo instalado tiene que tocar algún artefacto para volver
a pasar el auditor, era MAJOR.**

---

## 1.16.0 — 2026-10-08

**MINOR.** Un solo parser de tasks.md, compartido. Comportamiento idéntico —la salida del
auditor, del tablero y de sdd-state no cambia en ningún caso—, verificado contra el fixture
demo y con tests nuevos.

### Agrega

- **`scripts/lib/tasks.mjs`** — la única definición del parseo de `tasks.md`. Antes el mismo
  parseo vivía copiado en tres lugares, con el riesgo escrito en los propios comentarios
  ("Idéntico a taskCounts()... los dos tienen que contar igual"): el conteo de progreso del
  auditor (`taskCounts`), el check de trazabilidad US-N (CHECK 6) y el conteo del tablero
  (`lib/estado.mjs`). Copias que coincidían a mano y divergían al próximo cambio: de esa
  divergencia salieron el bug de la negrita (`- [ ] **T001**` contaba cero) y el doble defecto
  de CHECK 6. Ahora los tres consumidores leen el mismo módulo.

- **`scripts/lib/tasks.test.mjs`** — primer test unitario del framework (node --test, cero
  deps). Cubre negrita, tabla, el placeholder `US: —`, US-N en líneas de continuación, y la
  decisión de conservar `T\d{3}` exacto. Como la suite de distribución, no se materializa en
  consumidores y en CI se saltea donde el archivo no existe. Script: `pnpm test`.

### Cambia

- **`sdd-audit.mjs` y `lib/estado.mjs` consumen el parser único** en vez de sus regex propias.
  Sin efecto observable: es la misma cuenta desde un solo lugar. Primer paso del roadmap del
  "kernel SDD" (unificar el núcleo del modelo en un módulo con frontera pública); el resto
  queda para después de la auditoría ISO porque reescribe el auditor, que es la evidencia que
  esa auditoría mira.

---
## 1.15.0 — 2026-10-01

**MINOR.** Dos defectos que obligaban a adivinar, y los dos pasaban siempre.
Nada de lo anterior deja de funcionar: un grafo sin `planned` y un refine sin bloqueos se
comportan exactamente igual que antes.

### Agrega

- **Cuarto estado en `/sdd-refine`: `BLOQUEADO`.** Los tres que habia —CLARO, AMBIGUO,
  FALTANTE— asumen que la respuesta existe en la sala: AMBIGUO es "lo dijiste mal", FALTANTE es
  "no lo dijiste". Ninguno dice "nadie puede saberlo todavia". Y como la regla de cierre es dura
  ("no avances si algo no quedo claro"), cuando la pregunta no tenia respuesta posible la unica
  jugada era adivinar — y la adivinanza entraba a `input.md` indistinguible de una decision.

  Ahora se marca y se resuelve por una de tres salidas, que el humano elige: **(a)** sale del
  alcance de v1 y va a `OUT OF SCOPE`, **(b)** se asume con la suposicion declarada y registrada
  con `/sdd-log`, o **(c)** —el caso raro— sin esa respuesta no hay feature y el comando para.

  Marcar un bloqueo **no frena la feature**: en (a) y (b) el resto avanza entero. Lo que cambia
  es que la suposicion queda escrita en vez de disolverse en el texto.

- **`## SUPUESTOS Y BLOQUEOS` en `input.md`.** Lo escribe `/sdd-refine` cuando hubo bloqueos.
  `/sdd-generate` lo propaga: lo de (a) a `## Fuera de scope (v1)` de `spec.md`, lo de (b) a
  `constitution.md` como supuesto explicito — es una restriccion bajo la que se diseno todo lo
  demas, y si desaparece ahi nadie vuelve a saber que estaba.

- **`/sdd-validate` deja de contar los supuestos declarados como gaps.** Van en su propia
  seccion del reporte y en `supuestos_declarados`, no en `gaps_encontrados`. Mezclarlos destruia
  la senal: un numero alto dejaba de significar "la spec no cubre el brief" y pasaba a significar
  "no sabiamos algo y lo dijimos". Lo que si sigue siendo gap es una suposicion que `spec.md`
  contradice o que ningun artefacto refleja.

- **Metricas nuevas del refine:** `categorias_bloqueadas` y `bloqueos_resueltos` (a:N b:N c:N).
  `rondas_de_preguntas: 0` seguia diciendo "el handoff salio bien" aunque hubiera tres preguntas
  sin respuesta posible; ahora las dos cosas se distinguen.

  El mismo estado existe en `/dsc-refine` del discovery-model, con las siete categorias.

### Corrige

- **`graph/domain.yaml` separa `files` de `planned`.** Dos reglas del modelo se contradecian:
  `/sdd-generate` mandaba volcar los `touches` a `files`, y el CHECK 4 exige que todo lo de
  `files` exista. En greenfield eso es rojo garantizado entre `/sdd-generate` e `/sdd-implement`,
  y en brownfield pasa igual con cada archivo nuevo que crea una feature. No era un caso borde:
  pasaba siempre.

  Ahora `files` es lo que existe —lo unico que el routing puede leer— y `planned` lo que una
  feature abierta va a crear. `/sdd-review` mueve a `files`, al cerrar, lo que ya exista.

  El CHECK 4 no se debilita: gana un caso que antes no podia ver. Una ruta en `planned` que no
  existe y no tiene ninguna feature abierta que la cree es **FAIL** —una feature declaro un
  archivo y nunca lo construyo—, y una que ya existe pero sigue en `planned` es WARN.

  Compatible hacia atras: un grafo sin `planned` se comporta igual que antes. Las rutas futuras
  que hoy esten en `files` siguen dando FAIL hasta que se creen o se muevan.

---

---
## 1.14.0 — 2026-09-21

**MINOR.** El estado puede publicarse a un endpoint HTTP, no solo a un repo git.
Nada de lo anterior deja de funcionar: sin `--endpoint`, el comportamiento es identico.

### Agrega

- **`scripts/lib/transporte-http.mjs`** — espejo de `transporte-git.mjs`, mismo contrato de
  retorno y otro mecanismo. El destino existia desde 1.9.0 pero era siempre un repositorio: para
  llegar a una base de datos o a la API de una plataforma habia que copiar el archivo a mano, y
  un paso manual en el medio es exactamente lo que hace que un tablero muestre algo distinto de
  lo que el repo dice.

  Cero dependencias: `fetch` viene en Node.

- **`--endpoint` (o `SDD_ESTADO_ENDPOINT`) en `/sdd-publish`.** Se declara aparte de `--central`
  a proposito. `https://host/org/repo.git` es una URL de clonado y `https://host/estado` es un
  endpoint; distinguirlas por heuristica funciona hasta el dia que alguien monte el endpoint bajo
  una ruta que parezca un repo, y ese dia falla en silencio. Con las dos variables separadas, el
  destino lo declara quien publica.

  Tres respuestas se interpretan, no se propagan crudas: **409** y **304** son `sin-cambios` —el
  destino ya tiene algo igual o mas nuevo, y reintentarlo seria un bucle—; **sin red** es error
  pero el mensaje dice que el estado quedo en `metrics/estado.json` y se puede reenviar. Publicar
  sigue siendo observabilidad, no un gate.

- **Freno al token en texto plano.** Sobre `http://` el bearer viaja en claro. El transporte se
  niega a mandarlo a un host que no sea localhost, salvo que se declare `SDD_ESTADO_INSEGURO=1`.

  No fija el destino ni lo restringe: la URL sigue siendo libre —una base en la nube, otro Docker
  en la red— y esa libertad es el punto, porque el destino va a cambiar. Lo unico que cambia es
  que mandar una credencial en claro pasa a ser un acto deliberado, escrito una vez y visible
  para cualquiera que lea la configuracion, en vez de un descuido que nadie nota.

### Cambia

- **`--token` deja de aceptarse por linea de comandos.** Sale solo de `SDD_ESTADO_TOKEN`. Un token
  en la linea de comandos queda en el historial del shell y en la lista de procesos de la maquina.
  El workflow de CI ya lo pasaba por el ambiente, asi que no cambia nada de lo que este corriendo.

---
## 1.13.0 — 2026-09-14

**MINOR.** Publicar el estado se vuelve descubrible para el agente.

### Agrega

- **`/sdd-publish`** — la capacidad existia desde 1.9.0 pero nada la anunciaba: `CLAUDE.md` no
  mencionaba publicar, estado ni central, y no habia comando. Un dev que pedia "exporta el estado"
  dependia de que el agente adivinara — y el propio `CLAUDE.md` lo entrena a buscar en una tabla de
  triggers donde publicar no figuraba.

  El comando lleva lo que hoy solo sabia quien leyera el script: el gate de identidad, que el
  auditor en rojo no frena la publicacion, y que un "repository not found" sobre un central privado
  es falta de permiso y no un repo inexistente — con la instruccion de no inventar otro nombre ni
  sugerir crearlo.

  **Reparto por costo de contexto:** a `CLAUDE.md` —que se carga en cada sesion— van 219 bytes
  (una fila de trigger y una linea en el ciclo, ~54 tokens). Los ~482 tokens del comando se pagan
  solo cuando alguien publica. Es la misma divulgacion progresiva que el propio `CLAUDE.md` pide.

- **Recordatorio en `/sdd-review`** — cerrada la feature, sugiere publicar. Explicitamente **no**
  publica solo: escribe en un repo compartido entre proyectos y esa es una decision del dev, no un
  efecto colateral del gate de cierre.

---

## 1.12.0 — 2026-09-14

**MINOR.** El esfuerzo viaja desglosado, porque el total solo engana.

### Agrega

- **`desglose` en `features[].esfuerzo` y `desglose_proyecto` en `resumen.esfuerzo`** — los cuatro
  componentes que devuelve la API: `input`, `output`, `cache_creation` y `cache_read`.

  Hasta ahora viajaba solo el total, y el total es la peor sintesis posible de esos cuatro
  numeros. En una sesion larga `cache_read` —el contexto releido en cada request— pasa del 95%:
  en el repo de prueba, 116.897.179 de 119.809.409. Ese componente cuenta la misma conversacion
  cientos de veces, una por cada llamada, y se factura a una fraccion del precio de entrada.

  El efecto practico es que el documento reportaba "119 millones de tokens" cuando lo realmente
  generado eran 351.576 de salida. Un tablero que lea el total muestra un orden de magnitud que
  no corresponde al trabajo hecho.

  No se agrega una metrica derivada: viajan los cuatro componentes y el consumidor decide. Para
  un solo numero, `output + cache_creation` es mucho mejor proxy del trabajo real que el total.

---

## 1.11.0 — 2026-09-14

**MINOR.** El consumo de tokens se atribuye por feature, con un campo opcional.

### Agrega

- **`session_ids` en el bloque `## Implement`** — campo opcional que estampa `/sdd-implement` al
  cerrar. Es el unico dato que ningun script puede derivar: solo el agente que implemento sabe en
  que sesion lo hizo. Con el, `sdd-tokens` cruza esos ids contra ccusage y el reparto deja de ser
  inferencia para ser aritmetica.

  El bloque existente sigue siendo valido sin el campo: su ausencia deja el consumo en el total
  del proyecto, que es correcto. La regla que acompana al contrato es explicita — si no se sabe,
  se omite; inventarlo atribuye tokens ajenos.

  **Una sesion declarada por mas de una feature no se imputa a ninguna.** Pasa cuando se
  trabajaron varias features en la misma sesion, y repartirla —en partes iguales, por cantidad de
  tareas, por lo que sea— seria inventar. Queda en `sin_atribuir`, de modo que
  `suma(features) + sin_atribuir == total_proyecto` siempre cierra y las cifras por feature se
  pueden sumar sin contar dos veces.

- **`resumen.esfuerzo.total_proyecto`** — la suma por feature no incluye lo no atribuido, asi que
  sin este campo al lado un tablero mostraria menos consumo del real.

### Cambia

- **Lo medido le gana a lo narrado en `features[].esfuerzo`.** Si hay atribucion de ccusage, los
  tokens de la feature salen de ahi; si no, caen al reporte que escribe el agente. Antes el bloque
  publicaba solo `ciclos` —autorreportado— y dejaba vacio el unico campo observado, que es el
  orden inverso al deseable.

- `ultimoBloque` y `campo` pasan a exportarse desde `lib/estado.mjs`. `sdd-tokens` los necesita y
  duplicar el parseo de bloques ya costo dos bugs.

### Corrige

- **El aviso de `sdd-tokens` mentia.** Decia que sin `metrics/sessions.jsonl` no habia forma de
  atribuir por feature, incluso cuando la atribucion ya habia ocurrido: los ids ahora salen del
  bloque `## Implement`, no del hook. Ahora informa cuantas features se atribuyeron y cuantas
  sesiones quedaron afuera.

---

## 1.10.0 — 2026-09-14

**MINOR.** El consumo de tokens se mide en el pipeline, sin agente.

### Agrega

- **`scripts/sdd-tokens.mjs`** — corre ccusage, filtra las sesiones de este arbol y deja el
  consumo en `metrics/tokens.json`, que `sdd-state` transporta al documento. `sdd-publish` lo
  invoca antes de generar el estado.

  Existe porque `/sdd-metrics` es un comando de agente: un `.md` que necesita un modelo para
  ejecutarse, y un pipeline determinista no puede correrlo. De sus seis metricas una sola es
  medible por maquina —el token budget— y es la que este script extrae. Las otras cinco son el
  agente describiendo su propia sesion; no hay de donde sacarlas sin agente.

  **El alcance es de proyecto y se declara en el campo `alcance`.** ccusage reporta por sesion, y
  atribuir sesiones a features necesita el mapeo que escribe el hook en `metrics/sessions.jsonl`.
  Sin ese archivo, repartir el total entre features seria inventar. Se descarto correlacionar por
  ventana de tiempo: en una sesion se trabaja en varias features.

  Filtra por el slug derivado de la ruta, no por nombre de carpeta: ccusage reemplaza todo lo que
  no sea alfanumerico por guiones, y dos repos homonimos en carpetas distintas se atribuirian
  sesiones ajenas. No usa el bloque `totals` del JSON, que agrega todas las sesiones de la maquina.

  **No rompe el pipeline.** Sin ccusage, sin red o sin sesiones registradas, avisa y sale 0: el
  estado se publica igual con el esfuerzo en `SIN_DATO`. Medir es deseable; impedir que un
  proyecto reporte porque no se pudo medir, no.

### Corrige

- **En Windows no se podia invocar ccusage.** `npx` es un `.cmd` y desde la correccion de
  CVE-2024-27980 Node se niega a spawnearlo sin shell: devolvia EINVAL. `shell: true` tampoco
  sirve —concatena los argumentos en vez de escaparlos y Node lo marca deprecado—, asi que se
  invoca `npx-cli.js` con el propio ejecutable de Node, sin interprete de por medio.

---

## 1.9.0 — 2026-09-14

**MINOR.** El estado se publica al central con un comando, y el documento transporta esfuerzo.
Nada de lo anterior deja de funcionar.

### Agrega

- **`scripts/sdd-publish.mjs`** y el script `sdd:publish` — genera el estado y lo publica en el
  repo central de un tiro: corre el auditor con `--json`, corre `sdd-state`, calcula la ruta,
  clona el central, commitea solo si cambio algo real y pushea con reintento por rebase.

  Acepta el central como `org/repo`, URL, remoto SSH o ruta local. Sin `--token` usa la
  credencial de git de la maquina, que es lo correcto para una persona publicando su proyecto:
  no hay que crear un PAT ni un `.env`. `--token` queda para el CI, donde no hay credencial
  ambiente.

  **El workflow ahora llama a este script** en vez de repetir la logica en bash. Dos copias de
  la misma logica se separan y el tablero termina mostrando algo distinto de lo que el repo dice.

- **Esfuerzo en el documento publicado** — `features[].esfuerzo` y `resumen.esfuerzo`, leidos del
  bloque `### Reporte de Esfuerzo SDD` de `metrics/`.

  Tres cautelas que definen la forma. **El metodo viaja con el numero**: la Variante A son tokens
  reales de ccusage y la B es `bytes / 4`, una estimacion de lo leido; con metodos mezclados el
  agregado reporta `MIXTO` y **no totaliza**, porque sumarlos daria un numero que no significa
  nada. **`ciclos` declara `ciclos_origen: autorreporte`**: los tokens son observados, los ciclos
  los escribe el agente sobre si mismo, y en un tablero quedarian indistinguibles. **`SIN_DATO`,
  nunca `0`**: un cero ahi afirmaria que costo cero tokens.

  No se publica plata, solo tokens — igual que `/sdd-metrics`, que usa `--no-cost` a proposito.

### Cambia

- **`schema_version` del estado publicado pasa a `2`.** Se debia desde el rename
  `touches` -> `archivos_declarados`, que salio como cambio incompatible anunciado como
  compatible: un consumidor que leyera `touches` recibia `undefined` en silencio. Ahora cambia
  con motivo y con aviso.

### Corrige

- **El reporte de esfuerzo nunca se encontraba.** `bloques()` busca encabezados de nivel 2 y el
  reporte se escribe con `###`. La lectura ahora lo localiza aparte y corta en el proximo
  encabezado de cualquier nivel. `sdd-audit.mjs` tiene una copia de esa funcion pero no lee el
  reporte, asi que ahi el punto ciego es latente.

- **El total de tokens no se parseaba en tablas de dos columnas.** ccusage se reporta en dos y la
  variante estimada en tres; se tomaba la tercera celda a ciegas. Ahora se toma la ultima celda
  numerica de la fila TOTAL, sin contar columnas.

---

## 1.8.0 — 2026-09-08

**MINOR.** El estado del repo pasa a ser un documento que se puede publicar. Nada de lo anterior
deja de funcionar.

### Agrega

- **`scripts/lib/estado.mjs`** — un solo lector de "en qué estado está este proyecto". Recorre el
  registro, `tasks.md`, `feature.status.md` y los bloques de `metrics/`, y devuelve un objeto con
  features, sprints, avance por tarea y las cuatro fases.

  Usa **los mismos patrones de parseo que `sdd-audit.mjs`**. No es prolijidad: el tablero contaba
  las tasks con un patrón distinto al del auditor, así que mostraba `0 tareas` en toda feature real
  —contaba filas de tabla `| T01 |`, que es el formato del fixture `demo/`, mientras
  `/sdd-implement` escribe checkboxes `- [ ] T001`—. Con un lector único no pueden volver a
  discrepar.

  Lo que **no** lee, y no es casual: `spec.md`, `plan.md`, `constitution.md`, `DECISIONS.md` ni el
  grafo. El objeto está pensado para publicarse fuera del repo, así que las rutas de esos archivos
  no están en el código.

- **`scripts/sdd-state.mjs`** (`pnpm sdd:state`) — escribe ese objeto como JSON en
  `metrics/estado.json`. Es un proyector: no valida, no bloquea, no sale a la red. Acepta `--root`
  con la misma convención que el auditor, más `--out` y `--stdout`.

  `paraPublicar()` reduce `touches` de la lista de rutas a un número antes de escribir. El tablero
  local dibuja los archivos; el documento que sale del repo no describe la arquitectura del cliente.

- **Bloque `meta` en `specs/_registry/features.template.yaml`** con `repo` y `proyecto_id`. Describe
  al `DATA_ROOT`, no a una feature. `/sdd-generate` escribe `proyecto_id` la primera vez que lo ve
  en un brief, y **se niega a pisarlo** si ya hay otro distinto: dos proyectos de Discovery
  cayendo en el mismo árbol es una decisión humana.

- **`--publish-path` en `sdd-state.mjs`** y un job `estado` en `sdd-audit.yml` que sube el
  documento a un repo central, bajo `estado/<PRY-nnn>/<codebase>.json` — carpeta por proyecto,
  archivo por codebase, porque un proyecto puede tener varios.

  El script calcula la ruta y **se niega si al registro le falta `meta.proyecto_id` o `meta.repo`**:
  un archivo anónimo en un repo compartido entre clientes no se puede atribuir ni limpiar.

  Tres decisiones del job: corre con `always()` **aunque el auditor falle** —si solo publicara en
  verde, el tablero mostraría nada más que los proyectos sanos—; **nunca falla el build**, porque
  publicar es observabilidad y no un gate; y se saltea sola donde no está configurada la variable
  `SDD_ESTADO_REPO`, así el mismo archivo sirve en todos los repos. Solo commitea si cambió algo que
  no sea la marca de tiempo, y reintenta con rebase si otro repo publicó primero.

### Corrige

- **El campo `audit` no llegaba al documento publicado por CI.** `audit` y `estado` son jobs
  separados del workflow, cada uno con su propio `actions/checkout` y sin artifacts entre medio.
  El `--json` del job `audit` dejaba `metrics/audit-result.json` en un runner que se descarta, y
  el job `estado` arrancaba de un checkout limpio donde ese archivo no existe: `leerAudit`
  devolvia `null` y el documento salia sin veredicto. La feature funcionaba solo si alguien habia
  corrido el auditor a mano en su maquina, y entonces publicaba un veredicto viejo como si fuera
  actual. En el repo de prueba el documento decia `fail: 7` con 12 FAIL reales.

  El auditor ahora corre **dentro del job `estado`**, sobre el mismo checkout que produce el
  documento y segundos antes. El desfasaje deja de ser algo que hay que recordar y pasa a ser
  imposible por construccion: no hay ventana para que el veredicto envejezca ni caller que se lo
  pueda olvidar, porque esta adosado a su unico consumidor.

  Va con `|| true` a proposito. El auditor sale 1 cuando hay FAIL, y con `set -e` eso abortaba el
  step, lo marcaba fallido y salteaba la publicacion, dejando invisible justo al repo que el
  tablero necesita ver. Es la misma razon por la que el job corre con `always()`.

- **El contador de tasks no reconocía el identificador en negrita.** `taskCounts()` del auditor
  —y por copia, el lector nuevo— exigía `- [ ] T001` exacto. La primera corrida greenfield real
  del modelo produjo `- [ ] **T001** · …`, sin que nadie se lo pidiera: quien escribe ese archivo
  es un agente redactando markdown, y resaltar el ID en una lista de tareas es lo natural.

  El efecto no era cosmético. Con siete tareas bien generadas, el gate de `/sdd-implement` fallaba
  con *"declara 7/7 pero tasks.md tiene 0 tasks canónicas"* y no dejaba cerrar la feature. Ahora
  el patrón acepta `\*{0,2}` alrededor del identificador.

  Un patrón que exige una forma byte-exacta de un productor no determinista cuenta cero y nadie se
  entera. Queda pendiente el CHECK 6, que tiene el problema inverso —no falla, no dice nada— porque
  busca la referencia `US-N` en la misma línea de la tarea y el formato real la pone al cierre del
  bloque, tres líneas más abajo.

- **El CHECK 6 no verificaba la trazabilidad `US-N`: no decía nada.** Dos defectos encadenados.
  Su patrón pedía `- **T001**` y el formato real trae `- [ ] **T001**`, así que no reconocía
  ninguna tarea; sin tareas no hay ni WARN ni PASS, y el check desaparecía del reporte.

  Y arreglar solo el patrón lo habría empeorado: buscaba el `US-N` en la **línea** del encabezado,
  cuando la referencia cierra el bloque tres líneas más abajo. Habría pasado de mudo a marcar las
  7 tareas como sin trazabilidad, sobre un archivo que la tiene completa.

  Ahora acumula el bloque de cada tarea —desde su encabezado hasta el próximo— y busca el `US-N`
  ahí, con la misma forma que ya usa `metricsBlocks()`. Verificado en los dos sentidos contra el
  `tasks.md` de la corrida real: PASS con la trazabilidad completa, y WARN por las dos tareas
  exactas a las que se les quitó la referencia.

- **`sdd-audit --json`** deja el veredicto en `metrics/audit-result.json`, y el documento de
  estado lo transporta en un campo `audit`. Simetría con el discovery-model, que ya lo escribía.

  Sin esto, en un tablero que junta varios codebases **un repo con 7 FAIL se ve igual de sano que
  uno en verde**, y nadie tiene forma de notarlo. Leer el veredicto no rompe la definición de
  proyector: el auditor sigue siendo la única fuente, `sdd-state` lo lee de un archivo y no corre
  nada. Sin veredicto el campo va `null` — que no es lo mismo que pasar: es un repo sin medir.

- **`touches` se publica como `archivos_declarados`.** El nombre venía del registro, donde
  significa "rutas que la feature dice que va a crear". En un tablero, al lado de `tareas 0/7`,
  se lee como archivos ya tocados: parece una feature con siete archivos en juego cuando puede no
  existir ninguno. El número es el mismo. Adentro del modelo el campo sigue llamándose `touches`.

### Cambia

- `gen-kanban.mjs` consume `lib/estado.mjs` en vez de leer por su cuenta. El tablero se ve igual;
  el conteo de tareas ahora es el correcto.

### Nota

Lo que el lector no puede contar lo dice, no lo pone en cero: una feature con `tasks.md` en formato
de tabla reporta `formato: "tabla"` y `hechas: null`, y el resumen lleva `features_sin_contar`. Un
`0 de 8` se lee como "nada hecho" cuando en realidad es "no se sabe".

---

## 1.7.0 — 2026-08-27

**MINOR.** Documenta el mecanismo de distribución como contrato.

### Agrega

- **`contracts/distribucion.md`** — cómo viaja el framework de upstream a cada repo: las cuatro
  capas del mecanismo (transporte, instalación, verificación, control), por qué existe el paso de
  materialización, qué escribe la instalación y qué se niega a escribir, el ciclo de un release,
  quién verifica qué, y la diferencia entre integridad y autenticidad. Cierra el ítem 4.2 del
  rollout, que pedía elegir e implementar el mecanismo.

  Incluye lo que el mecanismo **no** resuelve y qué archivos son upstream-only
  (`sdd-release.yml`, `sdd-selftest.mjs`), más la constancia de que el fixture `demo/` es visual
  y hoy no pasa el auditor a propósito.

---

## 1.6.0 — 2026-08-27

**MINOR.** El framework pasa a tener tests de su propia distribución. Nada de lo anterior deja de
funcionar.

### Agrega

- **`scripts/sdd-selftest.mjs`** — 63 casos sobre la maquinaria de distribución: instalación en
  repos con historia, idempotencia, drift en `EXACT`/`BLOCK`/`MERGE`, la frontera del bloque de
  `CLAUDE.md`, colisiones de rutas, rechazo de path traversal, el veredicto del gate, `sdd-bump`,
  el CLI y el contenido del paquete. Instala en repos temporales, los rompe a propósito y
  verifica que cada mecanismo reaccione como dice el contrato.

  El modelo tenía 25 checkpoints para su ciclo de trabajo (`/sdd-test`) y **cero para su propia
  distribución** — justo la parte que más se movió. Esto cubre ese hueco.

  Corre en el CI del repo del modelo. **No es capa A**: no se materializa en repos consumidores
  ni viaja en el paquete, igual que `sdd-release.yml`. Prueba el framework, no una instalación
  — para eso está `sdd check`.

- **`compararVersiones` y `estadoVersion` en `scripts/lib/framework.mjs`.** El veredicto del gate
  —al día / adelantado / opcional / MAJOR pendiente— estaba escrito dos veces, en el CLI y en el
  workflow. Ahora vive en la lib, el CLI la usa, y la suite prueba el código real en vez de una
  reimplementación.

### Cambia

- `sdd-audit.yml` corre la suite cuando el archivo existe (`hashFiles`), así que en repos
  consumidores el paso se saltea solo.

---

## 1.5.2 — 2026-08-27

**PATCH.** El kanban reventaba en toda instalación nueva. Defecto previo, encontrado al revisar
si los cambios de distribución habían roto las herramientas del modelo.

- `pnpm kanban` leía `specs/_registry/features.yaml` sin verificar que existiera, y moría con un
  stack trace de `ENOENT`. **Un repo recién instalado está exactamente en ese estado** —el
  registro lo crea `/sdd-generate` al dar de alta la primera feature—, así que era el día uno de
  cada consumidor. Ahora dice qué falta, cómo se crea y cómo ver el tablero de ejemplo, y sale
  con código 0: no tener features todavía no es un error. Es el mismo criterio que ya usaba el
  auditor (*"modelo sin correr, nada que auditar"*).
- `pnpm kanban:serve` tenía la misma raíz con un `throw` en vez de un stack trace. Mismo trato.
- `gen-kanban.mjs` tampoco toleraba que faltara `specs/_registry/sprints/`.

---

## 1.5.1 — 2026-08-27

**PATCH.** Arregla los dos workflows que `1.5.0` rompió. **`1.5.0` nunca se publicó al
registry** — el tag existe, el paquete no. Usá `1.5.1`.

- **`sdd-audit.yml` fallaba en el paso de instalar dependencias.** El `corepack enable pnpm` que
  introduje trae la última pnpm, y sin campo `packageManager` en el `package.json` no resuelve
  una versión contra el lockfile del repo — en no interactivo eso falla seco. Ahora la detección
  del gestor es un paso propio con `id`, y cuando hay `pnpm-lock.yaml` se usa
  `pnpm/action-setup@v4` con la versión pineada, que es lo que funcionaba antes. npm, yarn y
  "sin lockfile" siguen cubiertos.
- **`sdd-release.yml` fallaba al publicar.** El cambio a `npm publish <tarball>` no funcionó
  contra GitHub Packages. Vuelve a `pnpm publish`, que tiene cinco releases exitosos. La
  attestation se conserva: `pnpm pack` es **determinista** —dos corridas dan el mismo SHA-256,
  verificado— así que el `.tgz` firmado y el publicado son los mismos bytes.

---

## 1.5.0 — 2026-08-27

**MINOR.** El CI del consumidor deja de asumir pnpm. Nada de lo anterior deja de funcionar.

### Cambia

- **`sdd-audit.yml` es agnóstico del gestor de paquetes.** Se materializa en cada repo
  consumidor y tenía `pnpm/action-setup` y `pnpm install --frozen-lockfile` hardcodeados: en un
  repo que usara npm o yarn, ese workflow fallaba en el primer PR. Ahora deduce el gestor del
  lockfile —igual que `sdd init`— y cae a `npm install` si no hay ninguno. Los dos scripts se
  invocan con `node`, no con `pnpm audit:sdd`: el atajo del `package.json` existe para las
  personas, no para el CI.

### Agrega (upstream, no se distribuye)

- **Attestation de procedencia en `sdd-release.yml`.** El workflow empaqueta primero, firma ese
  `.tgz` exacto con `actions/attest-build-provenance` y publica ese mismo archivo. La firma usa
  la identidad OIDC del workflow vía sigstore: **no hay llave privada que guardar ni rotar**.

  Es la diferencia entre integridad y autenticidad. `MANIFEST.sha256` prueba que los bytes no
  cambiaron desde que se hashearon, pero viaja adentro de la instalación: quien comprometa el
  upstream regenera el manifiesto y valida perfecto. La attestation prueba de dónde salió la
  caja — de este repo, de este commit, de este workflow. Se verifica con:

  ```
  gh attestation verify <archivo>.tgz --repo pmillanmc/sdd-model-v1.1
  ```

---

## 1.4.4 — 2026-08-27

**PATCH.** Menor privilegio en los workflows distribuidos.

- `sdd-audit.yml` y `sdd-version.yml` se materializan en cada repo consumidor y no declaraban
  `permissions:`, así que heredaban el default de *ese* repo — que en repos viejos puede ser
  `write-all`. Ahora declaran `contents: read`, que es todo lo que necesitan. `sdd-release.yml`
  ya declaraba `contents: read` + `packages: write` y no se distribuye.

---

## 1.4.3 — 2026-08-27

**PATCH.** Endurecimiento del instalador. Sin cambios de contrato.

- **Path traversal en la lista canónica.** Las rutas de `contracts/framework-files.txt` se
  resuelven contra la raíz del repo destino: una con `..`, absoluta, o con letra de unidad
  escribía **fuera** del árbol. Explotarlo exige controlar el framework —y quien lo controla ya
  controla el instalador— pero un `../../` escondido en una lista de rutas pasa una revisión de
  código que el mismo ataque escrito en JavaScript no pasaría. Se rechaza al parsear, donde los
  tres scripts leen la lista, y hay una segunda barrera en el momento de escribir.
- Una lista canónica inválida ahora imprime `FAIL` con el número de línea en vez de un stack trace.

---

## 1.4.2 — 2026-08-27

**PATCH.** Cosmético. La salida de `sdd init` daba dos guías contradictorias.

- `sdd-install` imprimía «Siguiente: 1. pnpm install · 2. verify · 3. audit» justo antes de que
  el CLI ejecutara esos mismos tres pasos numerados como 2/4, 3/4 y 4/4. Corriendo suelto el
  script tiene que decir cómo seguir; corriendo dentro de `sdd init`, no. El CLI ahora pasa
  `--no-next`. Detectado en la primera instalación real.

---

## 1.4.1 — 2026-08-27

**PATCH.** Ver qué va a pasar antes de que pase. Pensado para la primera instalación en un repo
con historia.

- `sdd init --dry-run` / `sdd update --dry-run` — muestra qué haría y corta sin escribir nada.
- `sdd-install` detecta **colisiones**: en una instalación nueva (destino sin manifiesto), un
  archivo que ya existe en una ruta de capa A no es una reinstalación, es un archivo del repo que
  se va a perder. Ahora los lista antes de escribir en `--dry-run`, y avisa cómo recuperarlos
  (`git checkout --`) si la instalación ya ocurrió. El caso típico: un repo con su propio
  `scripts/lib/` o su propio `scripts/sync-skills.mjs`.

---

## 1.4.0 — 2026-08-27

**MINOR.** Instalar el modelo pasa de cinco comandos a uno. Nada de lo anterior deja de funcionar.

### Agrega

- **`scripts/sdd-cli.mjs`** — un solo comando para todo el ciclo:
  - `sdd init` / `sdd update` — materializa, corre el gestor de paquetes que use el repo
    (deducido del lockfile), verifica integridad y audita. Cuatro pasos numerados en una corrida.
  - `sdd check` — integridad + consistencia, sin escribir nada.
  - `sdd version` — qué corre este repo y cuál es la última publicada, con el veredicto
    (al día / opcional / MAJOR pendiente).

  No agrega capacidad: orquesta `sdd-install`, `sdd-verify` y `sdd-audit`, que siguen siendo
  ejecutables por separado. Se declara como `bin` con dos nombres —`sdd` y `sdd-framework`—
  porque `npx` busca el bin que coincide con el nombre del paquete. Eso habilita instalar
  **sin registry y sin token**, aprovechando que el repo del modelo es público:

  ```
  npx github:pmillanmc/sdd-model-v1.1#v1.4.0 init
  ```

### Corrige

- `sdd-verify` reportaba dos veces el problema de marcadores rotos de `CLAUDE.md`: una desde la
  entrada `BLOCK` del manifiesto y otra desde el chequeo específico. Parecían dos fallas
  distintas. Detectado por la suite de distribución.

---

## 1.3.2 — 2026-08-27

**PATCH.** El instalador avisa lo que faltaba avisar. No cambia ningún contrato.

- `sdd-install` escribía `devDependencies.yaml` en el `package.json` del destino pero nadie
  instalaba el paquete, así que `pnpm audit:sdd` reventaba con `ERR_MODULE_NOT_FOUND` en toda
  instalación nueva. Ahora detecta qué dependencias aportadas por el framework faltan en
  `node_modules/` y pone `pnpm install` como primer paso de la secuencia siguiente.
  Detectado instalando 1.3.1 en un repo limpio de verdad.

---

## 1.3.1 — 2026-08-27

**PATCH.** Bugfix del gate de versión. No cambia ningún contrato.

- `.github/workflows/sdd-version.yml` no extraía el número de versión del tag: el patrón
  `s#.*/refs/tags/v##` exigía una barra antes de `refs`, pero `git ls-remote` separa el SHA
  del ref con un **tab**. El gate comparaba `.claude/VERSION` contra la línea entera
  (`<sha>	refs/tags/v1.3.0`) y nunca daba igual, así que siempre reportaba desactualización.
  Detectado al correr el gate a mano contra el primer tag publicado.

---

## 1.3.0 — 2026-08-27

**MINOR.** Agrega la maquinaria de distribución de la capa A. Ningún repo instalado
tiene que tocar un artefacto para seguir pasando el auditor.

### Agrega

- **`scripts/sdd-manifest.mjs`** — genera `.claude/MANIFEST.sha256` desde
  `contracts/framework-files.txt`. Corre upstream, al preparar un release. Los hashes son
  SHA-256 sobre contenido normalizado (CRLF→LF, sin BOM), así que Windows y el CI de Linux
  dan lo mismo. Con `--check` no escribe: falla si el manifiesto quedó desactualizado.
- **`scripts/sdd-install.mjs`** — materializa la capa A en un repo destino, con las tres
  semánticas de `contracts/framework.md` §2: `EXACT` copia el archivo entero, `BLOCK`
  reemplaza solo el bloque `SDD:FRAMEWORK` de `CLAUDE.md`, `MERGE` escribe solo las claves
  declaradas del `package.json` y preserva el resto. Se **niega a pisar drift**: si el destino
  tiene capa A editada localmente, aborta y la lista (`--force` para descartarla).
- **`scripts/sdd-verify.mjs`** — verifica el árbol contra el manifiesto instalado. No necesita
  la fuente ni la red: corre en el CI de cualquier repo consumidor.
- **`scripts/lib/framework.mjs`** — las primitivas compartidas por los tres.
- **`.github/workflows/sdd-version.yml`** — gate de versión: compara `.claude/VERSION` contra
  el último tag upstream. Atrás por MINOR/PATCH avisa; atrás por un MAJOR rompe el build.
  Es la única verificación del framework que sale a la red.

### Cambia

- `.github/workflows/sdd-audit.yml` corre `sdd-verify` antes del auditor.
- `package.json` aporta `sdd:manifest` y `sdd:verify`. `sdd:install` **no** es clave de capa A:
  su comando depende del transporte (`.sdd/scripts/…` o `node_modules/…`), y las rutas que
  cambian según el transporte están excluidas por `contracts/framework.md` §1.
- El fixture `demo/**` está declarado como opcional en repos de código: si no está, no falta;
  si está, se verifica como cualquier otra entrada de capa A.

### Nota

`.gitattributes` deja de ser prerequisito del manifiesto: la normalización de fin de línea
ocurre dentro del hash. Sigue siendo buena higiene de repo.

---

## 1.2.0 — 2026-08-25

> **Nota de versionado, pendiente de decisión.** Por la regla de `contracts/framework.md` §4
> este release es **MAJOR** y debería ser `2.0.0`: el contrato de gates agrega FAILs nuevos y
> la guarda de layout convierte un PASS en FAIL. Se etiqueta `1.2.0` porque **el radio de
> impacto es cero** — ningún repo instalado corrió el modelo todavía, así que no hay artefacto
> ajeno que haya que tocar. Si eso deja de ser cierto, el próximo cambio de contrato va a
> `2.0.0` sin excepción.

### Rompe (comportamiento que antes pasaba y ahora falla)

- **El auditor ya no pasa en verde apuntando a un árbol equivocado.** Nuevo CHECK 0: si el
  `DATA_ROOT` resuelto no contiene ninguna de `specs/`, `metrics/` o `graph/`, falla y nombra
  la ruta. Antes tomaba el camino "modelo sin correr, nada que auditar" y salía con exit 0 —
  el caso de la instalación como submódulo, donde auditaba el framework en lugar del repo.
- **Contrato de gates de métricas.** El auditor exige, y `/sdd-implement` y `/sdd-review`
  producen y verifican:
  - bloque `## Implement` con `tasks_completadas: m/m` y `tests: PASS` para habilitar review;
  - bloque `## Gate Override` con `authorized: true` y `validate_iteration` para implementar
    con gaps de validación abiertos;
  - una feature `CLOSED` sin `## Implement` ni `## Task T00X` es FAIL.

### Agrega

- **`--root <path>` en `scripts/sdd-audit.mjs`**, con default `process.cwd()`. Separa
  `DATA_ROOT` (el codebase auditado) de `FRAMEWORK_ROOT` (donde está instalado el framework):
  ningún script deriva el primero de su propia ubicación en disco. `gen-kanban.mjs` unifica su
  default con el de `kanban-server.mjs`.
- **Cabecera del reporte** con el `root:` resuelto y la versión del framework. Auditar el árbol
  equivocado deja de ser invisible.
- **`.claude/VERSION`** como fuente única de la versión instalada, alineada con
  `.claude/skills/VERSION`.
- **`contracts/`**: `paths.md` (contrato de rutas, las tres capas, el layout como interfaz),
  `framework.md` (qué es la capa A y qué significa un bump), `framework-files.txt` (lista
  canónica de 52 archivos con su tipo de verificación: `EXACT` / `BLOCK` / `MERGE`).
- **Marcadores `SDD:FRAMEWORK`** en `CLAUDE.md` para delimitar la parte distribuida de la
  parte propia de cada repo.
- **Trazabilidad con Discovery** (los tres parches del contrato de handoff): campos
  `discovery_id`, `epic`, `release`, `size` en el registro; `/sdd-refine` saltea el grilling
  cuando el brief trae las 6 secciones, verificando `contract_version`; `/sdd-generate` usa el
  `feature_id` y el `domain` del brief en vez de proponerlos.
- **Cortex como acelerador opcional**: fallback de exploración en `/sdd-implement` y
  `/sdd-fix`, insumo de descubrimiento en `/sdd-scan` con la procedencia registrada en
  `meta.generated_by`, y un paso opcional en `/sdd-setup` que detecta los cuatro estados
  (`CORTEX_OK`, `CORTEX_NOT_LOADED`, `CORTEX_BIN_MISSING`, `CORTEX_ABSENT`) e instala guiado.
  **Ningún gate ni check depende de él.**
- **`DECISIONS.md`** con seis entradas en `status: proposed` — la propuesta de arquitectura
  multi-codebase, sin firmar.

### Corrige

- **`iteration_number` en `/sdd-metrics`** se contaba sobre archivos `*-metrics.md` de
  `metrics/`, que siempre daba `1` porque hay uno por feature. Ahora cuenta bloques dentro del
  archivo. La telemetría de retrabajo entre iteraciones estaba inutilizada.
- **`/sdd-implement` es reanudable**: arranca en la primera task `- [ ]` y marca una por vez,
  recién cuando sus tests pasan.
- **El kanban no se auto-levanta.** `/sdd-generate` pregunta una vez; `/sdd-validate` y
  `/sdd-implement` solo dejan un recordatorio pasivo. Revierte el comportamiento introducido
  en `b8ccc19`.

### Saca del repo (sigue en disco, deja de viajar)

Telemetría local con rutas absolutas (`metrics/sessions.jsonl`), salidas generadas
(`kanban*.html`), basura de herramientas (`.playwright-mcp/`, `.qodo/`), config de cliente MCP
con rutas de máquina (`.cursor/mcp.json`) y material de comunicación (`*.docx`, `*.pdf`, los
`.html` de presentación). 21 archivos, ~460 KB.

### Deuda declarada, no cerrada

- El fixture `demo/` no pasa el auditor (9 FAIL): el registro declara 10 features y existen 2
  carpetas. Por eso **no** se agregó `audit:sdd:demo`.
- `meta.repo`, `capability`, `module`, `meta.aliases` y `CONTRACT.md` están definidos en los
  contratos y todavía **no los lee nadie**.
- El hook de sesión escribe en `CLAUDE_PROJECT_DIR/metrics`, no en el `DATA_ROOT`: en un
  monorepo con un root por app, la telemetría cae en el árbol equivocado.
- El CHECK 4 verifica existencia solo de las rutas bajo `files:`; las de `public:` e
  `internal:` no las mira nadie.
- No hay check de completitud del manifiesto: agregar un comando y olvidar su línea en
  `framework-files.txt` no falla.
- Falta la explicación para el dev (`/sdd-explain` no tiene sección multi-codebase, y el
  `README.md` no menciona el caso).

---

## 1.1.0 y anteriores

Sin changelog. `.claude/skills/VERSION` era la única versión declarada y solo la leía
`scripts/sync-skills.mjs`.
