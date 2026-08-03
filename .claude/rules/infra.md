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
