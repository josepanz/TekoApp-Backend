# OpenSpec en TekoApp-Backend — cómo trabajar acá

Esta carpeta replica el patrón SDD (Specification-Driven Development) ya validado en
`TekoApp-Frontend-Mobile/openspec/` (ver ese `README.md` para la justificación completa del
patrón) — se crea acá el 2026-08-23 porque este repo no tenía todavía una convención de spec
previa a la implementación. `.claude/memory/sessions/` documenta trabajo YA hecho (retrospectiva);
esta carpeta documenta comportamiento esperado ANTES de escribir código (prospectiva) — son
complementarias, no se reemplazan.

## Por qué recién ahora

Las primeras fases de este backend (auth, marketplace, pagos, ratings, ubicación) ya están
implementadas y no se retrofitea spec para ellas retroactivamente — el contrato real de esas
capacidades vive en el código + Swagger + `.claude/rules/`. Esta carpeta arranca con las **6
features grandes pedidas 2026-08-22** (ver
`TekoApp-Frontend-Mobile/openspec/decisions.md`, backlog de esa fecha), que José pidió
explícitamente documentar como spec antes de implementar por tocar los 3 repos a la vez y tener
implicancias legales/de datos sensibles.

## Estructura

```
openspec/
├── README.md    ← este archivo
├── project.md    ← dominio de negocio de este repo (referencia .claude/CLAUDE.md, no lo duplica)
├── decisions.md  ← decisiones de arquitectura específicas de estas 6 features (ADR-style)
├── specs/        ← el contrato de cada capacidad nueva: modelo de datos, qué es parametrizable,
│                   endpoints, casos de error
│   ├── professional-documents.md
│   ├── work-progress-log.md
│   ├── multi-option-quotes.md
│   ├── service-contracts.md
│   ├── ai-content-disclosure.md
│   └── data-and-media-consent.md
└── changes/      ← el plan de implementación en fases, con tasks y checkpoint de salida
    ├── 0001-professional-documents-and-background-checks.md
    ├── 0002-work-progress-log.md
    ├── 0003-multi-option-quotes.md
    ├── 0004-service-contracts.md
    ├── 0005-ai-content-disclosure.md
    └── 0006-data-and-media-consent.md
```

## Flujo de trabajo esperado

1. Abrir el archivo de la fase correspondiente en `changes/`. Cada uno tiene "Antes de empezar"
   (qué spec de `specs/` leer) y "Checkpoint de salida".
2. Leer la spec de `specs/` de la capacidad — ahí está el modelo de datos (Prisma, patrón
   `id`+`referenceId` de `.claude/rules/database-conventions.md`), qué es parametrizable/
   configurable, y el contrato de endpoints.
3. Implementar siguiendo `.claude/rules/typescript.md` (estructura `api/`+`modules/`, DTOs
   explícitos, `PrismaPaginationUtil`, transacciones multi-tabla, Prisma extended).
4. Si aparece una decisión no cubierta por la spec, agregarla a `decisions.md` con su motivo antes
   de seguir.
5. Al cerrar la fase: correr el checkpoint, marcar `tasks`, recién ahí pasar a la próxima.

## Orden de dependencia real (no es el orden de numeración)

`0006` (consentimiento de datos/imágenes) es la spec más fundacional — `0001`, `0002`, `0003` y
`0005` suben o marcan contenido personal/sensible que debe enganchar al marco de consentimiento de
`0006` en vez de inventar un flag propio. `0004` depende explícitamente de `0003` (el contrato se
genera a partir de la cotización aceptada). Se numeran en el orden que José las pidió, no en orden
de dependencia — ver `decisions.md` para la recomendación de secuencia real de implementación.

Todas comparten el punto de partida de `0006`, que a su vez extiende (no duplica) el marco legal
multi-país ya documentado en `TekoApp-Frontend-Mobile/openspec/decisions.md` ("Backlog — features
grandes pedidas 2026-08-08", ítem 4) — ese ítem sigue siendo la única fuente de verdad sobre el
límite "no soy asesor legal ni impositivo": estas specs modelan el flujo técnico, nunca el
contenido legal real.
