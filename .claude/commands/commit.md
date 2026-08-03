---
description: Genera un commit siguiendo el formato convencional del proyecto
---

Actualizá el knowledge graph con los cambios pendientes y luego creá un commit siguiendo **Conventional Commits** (impuesto por `commitlint` + husky en este repo — ver `commitlint.config.js`).

## Paso 0 — Actualizar grafo (antes de commitear)

```bash
# Solo re-extrae archivos nuevos o modificados — AST-only para TS, costo ~0 tokens
graphify update .
```

Si `graphify-out/graph.json` no existe aún, omitir este paso y avisar al usuario que puede generarlo con `/graphify .`. Si el binario `graphify` no es resoluble en el entorno (pasa en algunos sandboxes), omitir sin bloquear el commit.

## Formato

```
tipo(alcance): descripción
```

**Tipos válidos:** `feat`, `fix`, `refactor`, `chore`, `style`, `docs`, `test`, `perf`, `ci` (mismo set que `@commitlint/config-conventional`).

## Reglas de escritura

- Descripción en **español**, minúsculas, sin punto final, **sin nombres de archivos ni rutas**
- Describí el **qué y el por qué** del cambio, no el cómo ni los archivos tocados
- Una línea, máximo ~72 caracteres (el header tiene límite duro de 100 en este repo — ver `header-max-length` de commitlint)
- El alcance es el área de negocio/dominio afectado (`auth`, `payments`, `services`, `professionals`, `claude`…)

**Bien — describe intención:**

- `feat(payments): agregar retrofit TOCTOU a las transiciones de estado`
- `fix(auth): corregir expiración de contraseña sin chequear en el refresh`
- `chore(claude): instalar graphify y reglas de auditoría comparativa`

**Mal — nombra archivos o es demasiado literal:**

- `chore(claude): eliminar merchant-context-guard.ts y sus 3 usos`
- `feat(payments): modificar payment-db.service.ts para agregar retry`

## Pasos

1. Corré `git diff --staged --stat` para ver qué hay staged.
2. Si no hay nada staged, corré `git status --short` para ver el working tree.
3. Analizá todos los cambios (staged + unstaged + untracked) y agrupalos en commits temáticos atómicos — un commit por área de negocio/dominio coherente. Nunca mezcles cambios no relacionados en un solo commit.
4. Para cada grupo, en orden:
   a. Stageá solo los archivos de ese grupo (`git add <archivos>`).
   b. Ejecutá `git commit -m "mensaje"` **directamente, sin pedir confirmación**.
5. Al terminar todos los commits, mostrá `git log --oneline -10`.
6. **No pushees** salvo pedido explícito.
7. **Sin** `Co-Authored-By` ni ninguna atribución de Claude.
