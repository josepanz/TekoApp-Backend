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
- `release.config.cjs` (semantic-release) tolera un `committerDate` corrupto en
  `release-notes-generator` para que el pipeline de release no muera con
  `RangeError: Invalid time value` (causa raíz: una carrera de timing/chunking de stream en la
  dependencia sin mantenimiento `git-log-parser`, que en el job real de `qa` perdió 1 commit del
  rango — "Found 112 commits" cuando el rango real tenía 113; reproducido de forma determinística
  en el job real dos veces, pero NO en más de 20 clones fieles del mismo job en `ubuntu-latest`
  con las mismas dependencias exactas, ver PR #50). Esa tolerancia **enmascara el crash, no la
  pérdida de commits**: si el commit que se pierde trae el footer `BREAKING CHANGE`,
  `commit-analyzer` (que consume la misma lista) puede calcular un bump menor al que
  correspondía — ya pasó algo análogo en `master` por otra razón (salió `1.0.1` en vez de `2.0.0`,
  PR #49), no es hipotético. Mitigación manual: si un release de `qa`/`develop`/`master` incluye
  cambios incompatibles, verificar a mano la versión publicada contra lo esperado; y si el log del
  job "Version & Publish" reporta un "Found N commits" menor a `git rev-list <ultimoTag>..HEAD | wc -l`,
  re-ejecutar el job antes de dar esa versión por buena.
