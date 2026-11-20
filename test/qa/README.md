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
| `casos/CP-ENV.md` | M0 Entorno E2E | CP-BE-ENV-001..005 |
| `casos/CP-AUTH.md` | M1 Auth y sesión (smoke + W1) y contrato de error | CP-BE-AUTH-001..038, CP-BE-ERR-001..009 |
| `casos/CP-CAT.md` | M2 Catálogos | CP-BE-CAT-001..033 |
| `casos/CP-ONB.md` | M3 Onboarding profesional | CP-BE-ONB-001..047 |
| `casos/CP-UPL.md` | Autorización de archivos S3 (presigned/info/delete) y auditoría de IDOR en bitácora y presupuestos | CP-BE-UPL-001..018 |
| `casos/CP-MKT.md` | M4 Marketplace (ciclo de vida, concurrencia, IDOR, tabla serviceId vs serviceRequestId) | CP-BE-MKT-001..038 |
| `casos/CP-LOC.md` | Blindaje de `/locations` | CP-BE-LOC-001..007 |
| `casos/CP-SEED.md` | Seed del rol COMPLIANCE | CP-BE-SEED-001..002 |

## Cómo correr cada tipo de prueba

| Nivel | Comando | Requisitos |
|---|---|---|
| Unitario (Jest, ~138 suites, mocks) | `pnpm test` (o `pnpm test:cov`) | Node, `pnpm install` |
| Smoke / e2e real | `pnpm e2e:up` · `pnpm e2e:seed` · `pnpm test:e2e:real` · `pnpm e2e:down` (y `pnpm e2e:serve` para levantar el backend HTTP en el puerto 3100) | Docker, `docker-compose.e2e.yml`, `.env.e2e` (ver `test/e2e-real/README.md`) |
| E2E legacy (health mockeado) | `pnpm test:e2e` (`test/app.e2e-spec.ts`, `test/jest-e2e.json`) | Solo Node |

## Cómo generar los informes

| Comando | Qué hace |
|---|---|
| `pnpm qa:unit` | Corre Jest con `--coverage` (reporters `json-summary`, `lcov`, `text-summary`) y `--json`, y escribe `informes/AAAA-MM-DD_unit_<rama>.md`. Sale con el código de Jest (el umbral de cobertura incumplido hace fallar el comando, pero el informe se escribe igual). |
| `pnpm qa:e2e` | `e2e up` → `e2e seed` → `test:e2e:real` con `--json` (stdout/stderr de la app in-process a `informes/artefactos/<corrida>/logs/app.log` y `app-stderr.log`) → `docker compose -f docker-compose.e2e.yml logs` por contenedor a la misma carpeta → informe `..._e2e_<rama>.md` con la sección 7 (logs) → `e2e down` (siempre, aun con fallos). |
| `ts-node scripts/qa/report.ts from <unit\|e2e> <jest.json> [comando]` | Regenera un informe desde un JSON ya existente. |

La tabla de resultados, los totales por dominio, la cobertura y los casos fallidos/omitidos salen del JSON de Jest
y de `coverage/coverage-summary.json`; nunca se editan a mano. La sección 7 (logs de servicios, §3.7 del estándar) sale de `scripts/qa/logs.ts`: conteos por servicio de ERROR/FATAL, 5xx,
errores no manejados y WARN, y las primeras 10 líneas de error. Las secciones 3 a 6 (defectos `DEF-BE-NNN`,
desvíos, evidencia y veredicto) y la revisión de la 7 se completan a mano después de generar; un 5xx o error no manejado
en los logs con todo en verde impide el APROBADO hasta explicarlo (caso negativo con su CP) o registrarlo como DEF. En el informe e2e la columna `Caso CP` se
resuelve leyendo la fila `Automatizado en` de cada `casos/CP-*.md`: si se renombra un `it`, hay que actualizar el caso.

Variable opcional: `QA_EXECUTOR` fija el campo "Ejecutor" del encabezado.

## Convenciones

- Los tests nuevos o modificados llevan el bloque de encabezado del estándar §4 (Suite, Casos, Tipo, Prioridad,
  Precondiciones, Trazabilidad). Los tests viejos se documentan al tocarlos.
- `coverage/`, `.env.e2e` y `test/qa/informes/artefactos/` (logs de cada corrida) están ignorados por git; los informes `.md` sí se versionan.
