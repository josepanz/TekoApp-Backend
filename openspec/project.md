# Contexto del proyecto (backend)

Ver `.claude/CLAUDE.md` (dominio, estructura de carpetas, clientes, proveedores externos, auth,
base de datos, reglas críticas) y `.claude/rules/*.md` (typescript, database-conventions, test,
datetime, infra) — este archivo no los repite, solo ancla qué asume esta carpeta `openspec/` sin
tener que releer todo:

- Arquitectura en dos capas: `src/api/<domain>/` (HTTP: controllers, DTOs, services
  orquestadores) → `src/modules/<domain>-db/` (Prisma, lógica reutilizable). Ninguna spec nueva de
  esta carpeta se aparta de esta estructura.
- Patrón de identificadores: `id Int @id @default(autoincrement())` (uso interno, nunca expuesto
  en URLs/DTOs públicos) + `referenceId String @unique @default(uuid())` (id público) — obligatorio
  para toda tabla nueva que represente una entidad de negocio, ver
  `.claude/rules/database-conventions.md`.
- Transiciones de estado: siempre `updateMany` condicional + chequeo de `count === 0` →
  `ConflictException`, nunca `findUnique` + `update` incondicional (patrón TOCTOU-safe ya aplicado
  en `services.service.ts`/`payments.service.ts`/`promotions.service.ts`).
- Un listado vacío es `200` con `data: []`, nunca `404`.
- `Country`/`Category` ya existen como catálogos parametrizables (el segundo ya tiene
  `requiresVerification: Boolean` — varias specs nuevas siguen ese mismo espíritu de flag por
  categoría en vez de hardcodear reglas de negocio).

## Qué documenta esta carpeta

Las 6 features grandes pedidas por José el 2026-08-22 (ver
`TekoApp-Frontend-Mobile/openspec/decisions.md` para el pedido original completo y el backlog
2026-08-08 relacionado — en particular el ítem 4, marco legal/tributario multi-país, del que varias
de estas 6 features son extensión directa). No documenta retroactivamente las capacidades ya
implementadas antes de esta fecha.
