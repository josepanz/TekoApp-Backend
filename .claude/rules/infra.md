# Infrastructure rules

- Dockerfiles: node:22-alpine base, USER node before CMD
- Kubernetes: readiness and liveness probes in every deployment
- Secrets: never in ConfigMap, always in Secret or vault
- Pipelines: stages = lint → test → build → scan → deploy (el `scan` de seguridad sigue sin
  implementarse hoy — pendiente real, no repetir el gap de `portal-comercios-backend`, que tiene
  la misma omisión).
- Todo Ingress debe declarar `nginx.ingress.kubernetes.io/proxy-body-size` con un valor mayor al
  límite máximo de subida configurado en la app (hoy `MAX_FILE_SIZE` en `uploads.const.ts` = 5MB;
  el default de nginx sin esta anotación es 1MB, así que una subida de imagen sin esto falla en
  el ingress antes de llegar a la app) — comparado contra `portal-comercios-backend`, que sí las
  tiene en sus 3 ambientes (2026-07-21).
- El endpoint de healthcheck (`/tekoapp-backend/api/healthcheck`) NO puede moverse bajo `/v1` sin
  migrar primero los 9 paths de probes de los 3 ambientes (ci/develop/1_deployment.yml líneas
  60/67/75, ci/qa/1_deployment.yml líneas 60/67/75, ci/master/1_deployment.yml líneas 60/67/75) Y
  la config de health check en Render (fuera del repo). Motivo: un health check en 404 hace que el
  pod nunca llegue a Ready y el deploy falla con rollback inmediato; además, un rollback a una
  imagen anterior también fallaría si solo cambiaron los manifiestos y no se revierte la app.
- CAUSA RAIZ real de los crashes de `semantic-release` en "Version & Publish" (PR #50 y su
  seguimiento): la dependencia `git-log-parser` reconstruye cada commit haciendo split() de dos
  literales de texto legible (ver su código fuente) sobre el stdout crudo de `git log`, sin
  framing ni checksum. Si el **mensaje de CUALQUIER commit** contiene esos mismos literales como
  texto (por ejemplo, un commit que documenta ese mecanismo citándolos tal cual — nos pasó a
  nosotros mismos: el commit que agregó el primer fix citaba los delimitadores en su propio cuerpo,
  y el siguiente release lo volvió a parsear y colisionó), el split() encuentra delimitadores de
  más y desincroniza los campos de ese commit (hash/fecha/mensaje quedan con el valor de otro
  campo, o se pierde un commit entero — "Found 112 commits" en vez de 113 fue exactamente eso).
  **No es una carrera de timing** (esa fue la hipótesis inicial, descartada con evidencia: el bug
  es 100% determinístico y depende solo del contenido del mensaje). Consumidores afectados
  distintos según qué campo se corrompe: `release-notes-generator` con `committerDate` (crashea con
  `RangeError: Invalid time value`) y `@semantic-release/github` (paso "success") con `hash`
  (crashea con un error de parseo de GraphQL al armar una query con ese hash corrupto como alias).
  FIX REAL: patch de pnpm a `git-log-parser` (`patches/git-log-parser@1.2.1.patch`, declarado en
  `pnpm.patchedDependencies` de `package.json`) que cambia esos dos literales por caracteres de
  control ASCII que no aparecen en texto humano — cierra la colisión de raíz para cualquier campo
  y cualquier plugin, no solo para `release-notes-generator`. `release.config.cjs` además deja un
  `writerOpts.transform` de respaldo (no debería activarse nunca con el patch puesto).
  Consecuencia que NO se puede arreglar sin reescribir historia: el commit que disparó esto ya
  quedó publicado en `qa` con esos campos corruptos, y su entrada en el CHANGELOG/release notes de
  v1.0.0-qa.6 quedó mal formada (cosmético). Regla para no repetirlo: nunca citar textualmente los
  delimitadores de `git-log-parser` en un mensaje de commit o cuerpo de PR — citarlos en
  comentarios de código (como en `release.config.cjs`) es inocuo, porque `git log %B` solo lee el
  mensaje del commit, no el contenido de los archivos. Si alguna vez el log de "Version & Publish"
  vuelve a reportar menos commits que `git rev-list <ultimoTag>..HEAD | wc -l`, verificar primero
  si `pnpm.patchedDependencies` sigue aplicando (un bump de versión de `git-log-parser` puede hacer
  que el patch deje de matchear) antes de asumir que es un caso nuevo.
