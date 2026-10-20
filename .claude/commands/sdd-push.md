Empujá el código de la feature activa a una rama `sdd/<feature-id>` y abrí el MR.

```bash
pnpm push:code
```

Qué hace, en orden (determinista, solo git):
1. Resuelve el `feature-id` activo del registro (la única feature `OPEN`, o la que
   pases con `--feature <id>`).
2. Crea la rama `sdd/<feature-id>` desde HEAD **sin checkout** —no toca tu working tree—.
3. `git push -u origin sdd/<feature-id>`.
4. Imprime el link para crear el MR (lo arma desde el remote `origin`; GitLab además
   lo emite en la respuesta del push).
5. **Para ahí.** El merge a la rama protegida es humano: sin auto-merge, sin `--force`.

**Es manual por diseño.** No lo dispara `/sdd-review` ni `sdd-publish`: el push de
*código* es una cosa (esto) y la publicación de *telemetría* al tablero es otra
(`/sdd-publish`). Tienen destino, permisos y riesgo distintos.

Nunca empuja a la rama por defecto ni a una protegida: siempre a `sdd/<feature-id>`.
