# QA — TekoApp Backend

Documentación de pruebas según `C:\workspace\QA-DOC-STANDARD.md` (base ISO/IEC/IEEE 29119-3, simplificada).

```
test/qa/
  README.md              este índice
  PLAN-DE-PRUEBAS.md     alcance, niveles, entornos, criterios de entrada/salida, riesgos
  casos/CP-<MOD>.md      especificación de casos (ID, prioridad, pasos, resultado esperado, test que lo automatiza)
  informes/              un informe por ejecución real: AAAA-MM-DD_<tipo>_<rama-corta>.md
scripts/qa/report.ts     generador de informes (ts-node, sin dependencias nuevas)
```

## Casos

| Archivo | Módulo | Casos |
|---|---|---|
| `casos/CP-ENV.md` | M0 Entorno E2E | CP-BE-ENV-001..003 |
| `casos/CP-AUTH.md` | M1 Auth, smoke real | CP-BE-AUTH-001..006 |
| `casos/CP-LOC.md` | Blindaje de `/locations` | CP-BE-LOC-001..007 |
| `casos/CP-SEED.md` | Seed del rol COMPLIANCE | CP-BE-SEED-001..002 |

## Cómo correr cada tipo de prueba

| Nivel | Comando | Requisitos |
|---|---|---|
| Unitario (Jest, ~138 suites, mocks) | `pnpm test` (o `pnpm test:cov`) | Node, `pnpm install` |
| Smoke / e2e real | `pnpm e2e:up` · `pnpm e2e:seed` · `pnpm test:e2e:real` · `pnpm e2e:down` | Docker, `docker-compose.e2e.yml`, `.env.e2e` (ver `test/e2e-real/README.md`) |
| E2E legacy (health mockeado) | `pnpm test:e2e` (`test/app.e2e-spec.ts`, `test/jest-e2e.json`) | Solo Node |

## Cómo generar los informes

| Comando | Qué hace |
|---|---|
| `pnpm qa:unit` | Corre Jest con `--coverage` (reporters `json-summary`, `lcov`, `text-summary`) y `--json`, y escribe `informes/AAAA-MM-DD_unit_<rama>.md`. Sale con el código de Jest (el umbral de cobertura incumplido hace fallar el comando, pero el informe se escribe igual). |
| `pnpm qa:e2e` | `e2e up` → `e2e seed` → `test:e2e:real` con `--json` → informe `..._e2e_<rama>.md` → `e2e down` (siempre, aun con fallos). |
| `ts-node scripts/qa/report.ts from <unit\|e2e> <jest.json> [comando]` | Regenera un informe desde un JSON ya existente. |

La tabla de resultados, los totales por dominio, la cobertura y los casos fallidos/omitidos salen del JSON de Jest
y de `coverage/coverage-summary.json`; nunca se editan a mano. Las secciones 3 a 6 (defectos `DEF-BE-NNN`,
desvíos, evidencia y veredicto) se completan a mano después de generar. En el informe e2e la columna `Caso CP` se
resuelve leyendo la fila `Automatizado en` de cada `casos/CP-*.md`: si se renombra un `it`, hay que actualizar el caso.

Variable opcional: `QA_EXECUTOR` fija el campo "Ejecutor" del encabezado.

## Convenciones

- Los tests nuevos o modificados llevan el bloque de encabezado del estándar §4 (Suite, Casos, Tipo, Prioridad,
  Precondiciones, Trazabilidad). Los tests viejos se documentan al tocarlos.
- `coverage/` y `.env.e2e` están ignorados por git; los informes `.md` sí se versionan.
