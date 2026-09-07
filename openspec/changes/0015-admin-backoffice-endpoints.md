# Endpoints pedidos por Web para el backoffice admin

**Origen**: `I-01` del WORKPLAN de `TekoApp-Frontend-Web/openspec/changes/platform-hardening-2026-09/WORKPLAN.md`
(§6, workflow 4). Web ya escribió 4 specs (no implementadas del lado Web) que dependen de esto:

- `TekoApp-Frontend-Web/openspec/specs/admin-audit-log-viewer.md` → tarea `W-01` de este archivo.
- `TekoApp-Frontend-Web/openspec/specs/admin-data-export.md` → tarea `W-02`.
- `TekoApp-Frontend-Web/openspec/specs/admin-global-search.md` → tarea `W-03`.
- `TekoApp-Frontend-Web/openspec/specs/admin-bulk-actions.md` → **no requiere nada de acá**, ver
  la nota al final.

Este archivo ya trae la exploración hecha (archivos, DTOs, permisos, patrones exactos a copiar).
**No re-explorar el dominio de cada módulo entero** — cada tarea dice qué archivo abrir y qué
copiar. Si un archivo citado no existe o cambió de forma, recién ahí investigar puntual.

## Protocolo de ejecución (vale para las 3 tareas)

Este archivo es trabajo derivado de `platform-hardening-2026-09` y **hereda su protocolo**, no
uno propio. Antes de tocar código, leer `openspec/changes/platform-hardening-2026-09/WORKPLAN.md`
§0.1 (checkpoints) y §1.2 (Definition of Done). En resumen, lo que no es negociable:

- Rama `audit/2026-09-04`. **Nunca** commitear en `develop`, `qa` ni `master`.
- **Una tarea = un commit = un checkpoint.** Al terminar cada tarea: correr la DoD completa,
  commitear con el mensaje que la tarea indica, marcar la casilla en la tabla del final de este
  archivo con el hash, y **parar y reportar**. No seguir con la siguiente por iniciativa propia.
- DoD del §1.2: `pnpm run format`, `pnpm run lint`, `pnpm run test`, `pnpm run build` — los cuatro
  en verde, **0 warnings y 0 errores**. Prohibido reportar "completado" con el lint en rojo.
- Commits en español, Conventional Commits, header ≤100 chars. **Sin `Co-Authored-By` ni ninguna
  referencia a Claude/IA.**
- Ninguna de estas 3 tareas necesita migración: son endpoints de lectura sobre tablas que ya
  existen. Si alguna parece necesitar un cambio de schema, **parar y avisar** — la base de
  Supabase es compartida y toda migración necesita autorización explícita de José.
- **Cierre de cada tarea que publique un endpoint nuevo**: dejar anotado en el reporte que Web
  tiene que correr `pnpm generate:api-types` en su repo, y qué spec de Web queda desbloqueada
  (ver el mapeo del encabezado). Web tiene prohibido escribir esos tipos a mano.

Estado y dependencias cruzadas: `WORKPLAN.md` §8 (tabla de trabajo derivado) del change set
`platform-hardening-2026-09`.

---

## Convenciones de este repo (para no tener que descubrirlas)

- Permisos nuevos van en `src/common/enum/permissions.enum.ts`, formato
  `'dominio.subdominio:accion'` (ver bloque `PERMISSIONS` — copiar el patrón de `CONTRACTS`/`PAYMENTS`
  de ese mismo archivo).
- Un endpoint admin de solo lectura sigue el patrón exacto de
  `src/api/contracts/controllers/admin-contracts.controller.ts` (el más nuevo, hecho para esta
  misma clase de pedido): `@Controller('admin/<recurso>')`, `@UseGuards(JwtAuthGuard, PermissionsGuard)`
  a nivel de clase, `@Permissions(PERMISSIONS.X.Y, PERMISSIONS.ADMIN.ALL)` por método (el `OR` con
  `ADMIN.ALL` es obligatorio — todo endpoint de auditoría existente lo hace así).
- DTOs de query paginados extienden `PaginatedRequest<T>` de
  `src/common/dtos/request-with-pagination.dto.ts` (trae `page`/`pageSize`; agregar los filtros
  propios como campos del DTO, `@IsOptional()`).
- Después de publicar cualquier endpoint nuevo, avisar a Web para que corra
  `pnpm generate:api-types` en su repo — Web tiene prohibido escribir esos tipos a mano.
- Todo módulo nuevo se registra en `controllers`/`providers` de su propio `*.module.ts`, y ese
  módulo se importa en `src/app.module.ts` si no existe todavía — verificar con
  `grep -n "AuditLog\|audit-log" src/app.module.ts` antes de asumir que hace falta.

---

## W-01 · Endpoint de auditoría (`GET /admin/audit-logs`)

**Para**: `admin-audit-log-viewer.md` de Web.

**Verificación previa** (confirmar que sigue sin existir antes de tocar nada):

```bash
grep -rln "AuditLogs" src/api/ src/modules/
```

Si ya aparece un controller/servicio de `AuditLogs`, esta tarea puede estar hecha o en progreso —
parar y avisar, no duplicar.

**Contexto ya verificado** (no re-verificar): `prisma/schema.prisma` tiene `model AuditLogs`
(`@@map("audit_logs")`), poblada por triggers de DB, con columnas `tableName`, `recordId`,
`operationType`, `oldData`/`newData` (JSON), `changedAt`, `changedBy`, `reason`, `ipAddress`,
`userAgent`. Es de solo lectura desde la API — nada la escribe vía código de aplicación.

**Archivos a crear** (mismo layout que `src/api/contracts/`):

- `src/api/audit-log/audit-log.module.ts`
- `src/api/audit-log/controllers/admin-audit-log.controller.ts`
- `src/api/audit-log/services/audit-log.service.ts`
- `src/api/audit-log/dtos/request/get-audit-logs.query.dto.ts`
- `src/api/audit-log/dtos/response/audit-log.response.dto.ts`
- `src/api/audit-log/dtos/response/audit-logs-list.response.dto.ts`
- `src/api/audit-log/docs/audit-log.docs.ts` (Swagger — copiar el estilo de
  `src/api/contracts/docs/contracts.docs.ts`)

**Permiso nuevo** en `permissions.enum.ts` — agregar al final del objeto `PERMISSIONS`, antes del
cierre `} as const;`:

```ts
SYSTEM: {
  AUDIT_VIEW: 'system.audit:read',
},
```

**DTO de query** (`get-audit-logs.query.dto.ts`), extiende `PaginatedRequest`:

```ts
export class GetAuditLogsQueryDTO extends PaginatedRequest<GetAuditLogsQueryDTO> {
  @IsOptional() @IsString() tableName?: string;
  @IsOptional() @IsString() recordId?: string;
  @IsOptional() @IsString() changedBy?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
```

**DTO de response** (`audit-log.response.dto.ts`) — `id` es `BigInt` en Prisma, exponer como
`string` (igual que cualquier otro id grande en este repo, ver convención `#0008` de
`referenceId`/ids):

```ts
export class AuditLogResponseDTO {
  id!: string; // BigInt serializado
  tableName!: string;
  recordId!: string;
  operationType!: string;
  oldData!: unknown | null;
  newData!: unknown | null;
  changedAt!: Date;
  changedBy!: string;
  reason!: string | null;
}
```

**Service**: `prisma.auditLogs.findMany` con `where` armado desde los filtros del DTO (`tableName`/
`recordId`/`changedBy` exact-match, `changedAt` con `gte`/`lte` para el rango), `orderBy: { changedAt: 'desc' }`,
paginación manual `skip`/`take` (mismo cálculo que `PrismaPaginationUtil.paginate` en
`src/common/utils/prisma-pagination.util.ts` si se quiere reusar ese helper — verificar que acepta
un modelo con `id: BigInt` antes de asumirlo, si no, paginar a mano igual que
`contracts.service.ts#listAudit`). Serializar `id` con `.toString()` antes de devolver (BigInt no es
serializable a JSON directo).

**Controller** (`admin-audit-log.controller.ts`), calcado de `admin-contracts.controller.ts`:

```ts
@ApiTags('Auditoría (staff)')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminAuditLogController {
  constructor(private readonly service: AuditLogService) {}

  @Get()
  @Permissions(PERMISSIONS.SYSTEM.AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)
  async list(@Query() query: GetAuditLogsQueryDTO): Promise<AuditLogsListResponseDTO> {
    return this.service.list(query);
  }
}
```

**Tests**: `audit-log.service.spec.ts` (filtros combinados, paginación, `id` serializado a string)
+ test de guard (403 sin `SYSTEM.AUDIT_VIEW` ni `ADMIN.ALL`) — mismo patrón que
`contracts.service.spec.ts`.

**Commit**: `feat(audit-log): agregar endpoint de solo lectura para el visor de auditoria admin`

---

## W-02 · Export CSV/Excel de pagos y profesionales

**Para**: `admin-data-export.md` de Web. Empezar por **pagos** (lo prioriza el propio pedido de
Web); profesionales queda como segunda iteración de la misma tarea, no una tarea aparte.

**Verificación previa**:

```bash
grep -n "@DownloadFile\|DOWNLOAD_FILE_KEY" src/api/payments/controllers/*.ts src/api/professionals/controllers/*.ts
```

Debe devolver vacío (nadie lo usa hoy) — si ya hay un uso, revisar si cubre lo que pide Web antes
de agregar otro.

**Ya existe y hay que reusar, no reinventar**:

- `src/core/interceptors/file-download.interceptor.ts` (`FileDownloadInterceptor`) + decorator
  `@DownloadFile()` de `src/common/decorators/file-download.decorator.ts` — ya arman la respuesta
  binaria con `Content-Disposition` correcto. El método del controller solo tiene que devolver
  `{ buffer, filename, format }` (`IDownloadResponse`).
- `exceljs` (`^4.4.0`) **ya está en `package.json`** — no agregar ninguna dependencia nueva para
  esto, ni para `.xlsx` ni para `.csv` (`exceljs` también puede escribir CSV).

**Alcance de esta iteración**: **CSV únicamente**. `.xlsx` con `exceljs` queda para una iteración
2 si Web/negocio lo pide después de tener CSV andando — no bloquear esta tarea armando ambos
formatos de una.

**Archivos a tocar** (no crear módulo nuevo — agregar un método al controller/service que ya
existen):

- `src/api/payments/controllers/payments.controller.ts` — nuevo endpoint
  `GET /admin/payments/export` (**controller nuevo** `AdminPaymentsController` en
  `src/api/payments/controllers/admin-payments.controller.ts`, no agregarlo al controller
  `payments` existente que es `@Controller('payments')` sin prefijo `admin/` — mismo criterio que
  `AdminContractsController` está separado de `ContractsController`).
- `src/api/payments/services/payments.service.ts` — método nuevo `exportToCsv(filters)` que
  reusa la misma query que `getPayments` (mismos filtros: `userId`, `professionalId`, `status` —
  ver `PaymentListQueryDTO` en `src/api/payments/dtos/request/`), sin paginar (trae todas las filas
  que matchean el filtro — el volumen lo controla el filtro, no una página).
- Repetir el mismo patrón para profesionales:
  `src/api/professionals/controllers/admin-professionals-export.controller.ts` (o agregarlo al
  controller admin de professionals si ya existe uno — verificar con
  `find src/api/professionals/controllers -iname "admin-*"` antes de crear uno nuevo).

**Permisos**: **ninguno nuevo**. Usar el que ya gatea cada dominio:

- Pagos: `PERMISSIONS.PAYMENTS.AUDIT_VIEW` (mismo que `GET /payments` admin, ver
  `payments.controller.ts`).
- Profesionales: `PERMISSIONS.PROFESSIONALS.VERIFY` — **decisión explícita**: `GET /professionals`
  hoy no tiene ningún gate de permiso (es de lectura pública para cualquier usuario autenticado,
  browse de clientes), así que el export **no puede** heredar "el mismo permiso que el listado"
  como en pagos. `PROFESSIONALS.VERIFY` es el permiso de staff más cercano que ya existe sobre este
  dominio — no inventar uno nuevo solo para esto salvo que se decida lo contrario.

**Controller** (esqueleto):

```ts
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminPaymentsController {
  constructor(private readonly service: PaymentApiService) {}

  @Get('export')
  @Permissions(PERMISSIONS.PAYMENTS.AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)
  @DownloadFile()
  async export(@Query() query: PaymentListQueryDTO): Promise<IDownloadResponse> {
    return this.service.exportToCsv(query);
  }
}
```

**Tests**: el `.spec.ts` del service verifica que el buffer generado, decodificado, tiene las
columnas y filas esperadas (no solo que "no tira error") + un test de guard (403 sin permiso).

**Commit**: `feat(payments): agregar export csv para el panel admin` y, en un commit separado,
`feat(professionals): agregar export csv para el panel admin` — son dos dominios, dos commits, no
agrupar (misma regla que Web viene aplicando en su propio WORKPLAN).

---

## W-03 · Búsqueda por texto en listados (habilita búsqueda federada real desde Web)

**Para**: `admin-global-search.md` de Web — la "opción intermedia" de esa spec (solo por id
exacto) deja de ser necesaria si esto se hace, porque Web puede pegarle con texto libre a los
listados que ya tiene.

**Hallazgo clave ya verificado** (no re-verificar): `src/common/utils/prisma-pagination.util.ts`
(`PrismaPaginationUtil.paginate`) **ya soporta** un filtro `search` genérico vía `query.search` +
`options.searchFields` (búsqueda multi-palabra, AND de ORs). Es infraestructura ya escrita, solo
falta que cada DTO/service la use.

**Estado real por entidad (verificado)**:

- **`users`** (`src/api/users/dtos/request/list-users.request.dto.ts`): **ya tiene** `name` y
  `email` como filtros (`users-api.service.ts:70`). Antes de tocar nada acá, correr:
  ```bash
  grep -n "name\|email" src/api/users/services/users-api.service.ts | head -20
  ```
  y confirmar si el filtro es `contains` (búsqueda parcial, sirve tal cual para Web) o
  `equals`/exacto (en ese caso sí hace falta cambiarlo a `contains`, `mode: 'insensitive'`). **No
  asumir cuál es sin correr ese grep.**
- **`professionals`** (`src/api/professionals/dtos/request/get-professionals-list.query.dto.ts`):
  **no tiene** ningún filtro de texto hoy (verificado — solo `categoryId`/`latitude`/`longitude`/
  `radius`/`minRating`/`maxPrice`/`isAvailable`). Agregar un campo `search?: string`
  (`@IsOptional() @IsString()`) al DTO, y en
  `src/api/professionals/services/professionals.service.ts#getProfessionals` pasarlo al filtro
  que arma `professionalsDb.findMany` — ese método vive en un DB module aparte
  (`ProfessionalsDbModule`, no revisado en detalle acá); buscar dónde arma el `where` de Prisma
  ahí y agregar un `OR` sobre el nombre/apellido del `user` relacionado (`user.firstName`/
  `user.lastName`, `mode: 'insensitive'`, `contains`).

**No incluye**: un endpoint agregador único (`GET /admin/search`) que junte resultados de varias
tablas en una sola respuesta — **no se pide en esta iteración**. Web hace la agregación del lado
cliente pegándole a `GET /users?search=...` y `GET /professionals?search=...` en paralelo. Si más
adelante se quiere un endpoint agregador real, es una tarea nueva y más grande, no parte de esto.

**Tests**: un caso por entidad que confirme que `search`/`name`/`email` filtra por coincidencia
parcial, case-insensitive.

**Commit**: `feat(professionals): agregar filtro de busqueda por nombre al listado` (solo
profesionales necesita cambio de código si `users` ya filtra por `contains`; si `users` resulta
usar `equals`, sumar `fix(users): busqueda por nombre/email debe ser parcial, no exacta` como
commit separado).

---

## Nota — Acciones masivas (`admin-bulk-actions.md`): no requiere nada de este repo

La spec de Web para acciones masivas usa los endpoints de un solo ítem que **ya existen**
(`DELETE /categories/:id`, `DELETE /ratings/:id`, etc.), llamándolos varias veces desde el
cliente. No hay ningún pedido de backend en esa spec — se deja esta nota solo para que quede
registrado por qué `admin-bulk-actions.md` no tiene una tarea `W-0N` acá.

---

## Tabla de seguimiento

| ID   | Prioridad | Estado | Commit | Notas |
| ---- | --------- | ------ | ------ | ----- |
| W-01 | MEDIA     | [ ]    |        | Endpoint de auditoría — nuevo módulo `audit-log` |
| W-02 | ALTA      | [ ]    |        | Export CSV pagos + profesionales — dos commits separados |
| W-03 | MEDIA     | [ ]    |        | Verificar `users` (`contains` vs exacto) antes de tocar `professionals` |
