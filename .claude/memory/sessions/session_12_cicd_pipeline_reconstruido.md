# Sesión 12 — 2026-06-10/11 — CI/CD pipeline y arquitectura inicial (reconstruido de git log)

> Nota: esta entrada se reconstruyó el 2026-07-20 a partir del historial de git, porque el
> protocolo de cierre de sesión (`memory.md`) no se ejecutó en su momento. No hay registro de
> las decisiones discutidas en vivo — solo el resultado verificable en commits y PRs.

## Qué se hizo (según git log / PRs #2–#14)

- Arquitectura inicial de módulos (`feat: initial arquitecture and modules`, PRs #2, #3)
- Configuración completa de GitHub Actions CI/CD (`pipeline.yml`): stages lint → test → build → docker → deploy
- Integración de `semantic-release` con 3 ramas (`master`, `qa` prerelease, `develop` prerelease) y `.releaserc.json`
- Reemplazo de rama `staging` por `qa` en el flujo de branching
- Ajustes de permisos de ejecución en scripts `.sh` (`scripts/replace-version.sh`, `scripts/deploy.sh`)
- Merge secuencial `develop → qa → master` (PRs #13, #14) para el primer release `1.0.0`

## Estado al cerrar

`master` en `1.0.0`, `qa` en `1.0.0-qa.1`, `develop` en `1.0.0-develop.9` (vía tags de semantic-release).
Pipeline funcional confirmado por runs exitosos en GitHub Actions.
