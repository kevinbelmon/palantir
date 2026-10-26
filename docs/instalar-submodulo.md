# Instalar el modelo SDD como submódulo (desde GitLab)

Guía para instalar el framework SDD en **tu** repo tomándolo como submódulo del
repositorio del modelo en GitLab:

```
https://gitlab.proguidemc.com/ia/models.git   (rama por defecto: develop)
```

Verificado end-to-end el 2026-10-21 contra el modelo **v2.1.0**: `submodule add` +
`init` → materializa, instala deps, verifica integridad (78/78) y audita (0 FAIL).

---

## Requisitos

- **Node.js** (probado con v24).
- Un **gestor de paquetes** — el modelo usa `pnpm` por defecto.
- El **token de acceso read-only** del repo `ia/models` (te lo pasan por un canal
  seguro, nunca por el repo).

---

## 1. Configurar la credencial (una sola vez por máquina)

> **¿Ya tenés credenciales que funcionan para este GitLab** (clonás/empujás otros repos
> de `gitlab.proguidemc.com` sin problema)? Entonces **saltá este paso**: el `submodule add`
> ya anda con tu credential manager. Este paso es para quien **no** tenga acceso configurado
> (gente sin cuenta, CI) o a quien se le da **solo lectura** con el token.

El token **nunca** va dentro del repo. Se configura con `insteadOf` **acotado a este repo**
(no a todo el host), así no pisa tus credenciales de los demás repos de ese GitLab:

```bash
git config --global url."https://oauth2:<TOKEN>@gitlab.proguidemc.com/ia/models.git".insteadOf "https://gitlab.proguidemc.com/ia/models.git"
```

> Si es un **deploy token** (tiene usuario propio), usá ese usuario en vez de `oauth2`:
> `https://<USUARIO_DEL_TOKEN>:<TOKEN>@gitlab.proguidemc.com/ia/models.git`

> ⚠️ **No uses la forma a nivel host** (`.../insteadOf "https://gitlab.proguidemc.com/"`):
> reescribiría **todas** las URLs de ese GitLab con el token read-only y saltearía tu
> credential manager, así que un push a otro repo fallaría.

Verificá que quedó bien (debe devolver un hash, sin pedir usuario/clave):

```bash
git ls-remote https://gitlab.proguidemc.com/ia/models.git HEAD
```

---

## 2. Instalar el modelo como submódulo

Parado en la **raíz de tu repo**:

```bash
# 1. Agregar el submódulo (la URL queda limpia, sin token)
git submodule add https://gitlab.proguidemc.com/ia/models.git .sdd

# 2. (Opcional, recomendado la primera vez) ver qué va a tocar, sin escribir nada
node .sdd/scripts/sdd-cli.mjs init --root . --dry-run

# 3. Materializar: copia capa A + instala deps + verifica integridad + audita
node .sdd/scripts/sdd-cli.mjs init --root .

# 4. Commitear el submódulo y lo materializado
git add .gitmodules .sdd .claude scripts contracts CLAUDE.md package.json
git commit -m "chore: instalar framework SDD (submódulo .sdd desde GitLab) + materializar"
```

Después configurá los MCPs y el hook de sesión:

```
/sdd-setup
```

---

## 3. Si clonás un repo que YA tiene el submódulo

El submódulo no viene con el clone normal. Con la credencial del paso 1 ya puesta:

```bash
git clone <tu-repo>
cd <tu-repo>
git submodule update --init --recursive
```

(O en un paso: `git clone --recurse-submodules <tu-repo>`.)

---

## 4. Actualizar a futuro

```bash
git -C .sdd pull origin develop
node .sdd/scripts/sdd-cli.mjs update --root .
git add .sdd .claude scripts contracts CLAUDE.md package.json
git commit -m "chore: actualizar framework SDD"
```

---

## Notas

- **El requisito ineludible del "y listo":** al ser repo privado, cada persona tiene
  que hacer el paso 1 **antes** del `submodule add`/`update`, o git corta con error de
  autenticación. El token read-only compartido es lo de menor fricción.
- Queda el framework **dos veces**: el repo vendoreado en `.sdd/` (fuente pinneada para
  re-materializar sin red) y la copia materializada en `.claude/`, `scripts/`, etc. Se
  trabaja con la materializada.
- **No edites a mano** los archivos de capa A materializados (`.claude/commands`,
  `scripts/`, `contracts/`, …): se cambian upstream y se redistribuyen; un cambio local
  lo marca el manifiesto de integridad.
- **Pull rápido y puntual** (sin configurar `insteadOf`): metés el token en la URL del
  clone — `git clone https://oauth2:<TOKEN>@gitlab.proguidemc.com/ia/models.git`. Simple,
  pero deja el token en texto plano en `.git/config` de ese clone.
- `sdd version` no consulta upstream en esta configuración (apunta al GitHub original y
  GitLab no tiene tags `vX.Y.Z`); es inofensivo.
