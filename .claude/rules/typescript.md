# TypeScript rules

## Estructura de carpetas obligatoria (api/* y modules/*)

Todo módulo en `src/api/<domain>/` y `src/modules/<domain>/` debe seguir esta estructura:

```
src/api/<domain>/
├── <domain>.module.ts
├── controllers/
│   └── <domain>.controller.ts
├── services/
│   └── <domain>.service.ts
└── dtos/
    ├── request/
    │   ├── index.ts
    │   ├── get-<domain>-list.query.dto.ts
    │   ├── get-<domain>-detail.param.dto.ts
    │   ├── create-<domain>.request.dto.ts
    │   └── update-<domain>.request.dto.ts
    └── response/
        ├── index.ts
        ├── <domain>-detail.response.dto.ts
        └── <domain>-list.response.dto.ts

src/modules/<domain>-db/
├── <domain>-db.module.ts
├── interfaces/
│   └── <domain>-db.interface.ts
├── types/
│   └── <domain>-db.type.ts
└── services/
    └── <domain>-db.service.ts
```

**Reglas:**
- `controller.ts` siempre en `/controllers/` — nunca en la raíz del módulo
- `service.ts` siempre en `/services/` — nunca en la raíz del módulo
- `/dto` → siempre `/dtos` (plural), conteniendo `/request` y `/response`
- Interfaces, enums, types, helpers → en sus carpetas `/interfaces`, `/enums`, `/types`, `/helpers` — nunca inline en services
- **Todos los métodos de controllers y services deben tener tipo de retorno explícito** con DTO de respuesta tipado

## Response DTOs — obligatorio

- Todo endpoint que retorna datos debe tener su `*ResponseDTO` explícito declarado como tipo de retorno
- Los servicios de la capa `api/*` deben declarar el tipo de retorno de cada método con el ResponseDTO correspondiente
- Para listas paginadas: extender `PaginatedResponse<T>` (de `@common/dtos/response-with-pagination.dto`)
- Para queries paginadas: extender `PaginatedRequest<T>` (de `@common/dtos/request-with-pagination.dto`) — usar `pageSize` (no `limit`)
- Usar `PrismaPaginationUtil` para todo endpoint de listado con paginación
- Swagger: `@ApiResponse({ status: 200, type: ResponseDTO })` o `type: [ResponseDTO]` — siempre con tipo explícito

- Use JOI for input `config-schema.ts` on all secrets.
- Explicit DTOs in NestJS, API tags, validations `(class-validator)` or `(ValidatorConstraint)` with validate and decorator, and transformations `(class-transformer)` if necessary (if applicable to multiple endpoints, create a validator and its specific decorator), with typed enums if applicable, Swagger documentation `(@nestjs/swagger, ApiProperty, ApiPropertyOptional)` and examples for both requests and responses, also for parameters and queries (use DTO in uppercase at the end), examples: GetUsersListQueryDTO, GetUserDetailParamDTO, CreateUserRequestDTO, CreateUserResponseDTO, UpdateUserRequestDTO, UpdateUserResponseDTO (not generic interfaces).
- Always generate the queryDTO, requestDTO, paramDTO under the cited rules, do not create for example @Param('id', ParseIntPipe) id: number; alone, always do everything from your dto with validation, transformation and Swagger documentation mentioned.
- Generate documentation in the docs folder to minimize content in the controller and invoke it in the controller with a decorator
- Use Prism types directly where possible; avoid remapping
- Always use Prisma Extended to coexist with the audit
- Create the interfaces, enums, types, constants, helpers for each folder, whether in /api or /module, under a folder named /interfaces, /enums, /types, /constants, /helpers to expose to the services; never place these values ​​in the services themselves.
- Do not use the repository class to call Prisma; the repository is intended solely for specific raw queries in SQL format. Integration of a `/module/*db/*.service.ts` file should call Prisma directly to execute actions on the database.
- If it's an endpoint for listing with filter parameters and pagination, use `PrismaPaginationUtil`
  - Example of use:

  ```typescript
    async getCustomersListByParams(
    queryDTO: GetCustomerRequestDTO.GetCustomersListQueryDTO,
    merchantContext: IMerchantContext,
  ): Promise<GetCustomerResponseDTO.GetCustomersListResponseDTO> {
    const customWhere: Prisma.CustomersWhereInput = {};

    if (queryDTO.search) {
      customWhere.OR = [
        { name: { contains: queryDTO.search, mode: 'insensitive' } },
        { lastname: { contains: queryDTO.search, mode: 'insensitive' } },
        { email: { contains: queryDTO.search, mode: 'insensitive' } },
        { phone: { contains: queryDTO.search, mode: 'insensitive' } },
        { documentNumber: { contains: queryDTO.search, mode: 'insensitive' } },
      ];
    }

    if (queryDTO.status !== undefined) {
      customWhere.active = queryDTO.status;
    }

    customWhere.merchantCode = merchantContext.merchantCode;

    const { data: rawOrders, pagination } =
      await PrismaPaginationUtil.paginate<CustomersWithRelations>(
        this.prisma.extended.customers as unknown as PrismaModelDelegate,
        queryDTO as unknown as Record<string, unknown>,
        {
          where: customWhere,
          include: { salesOrders: true },
          defaultOrderByField: 'createdAt',
          fieldMapping: {
            status: 'active',
          },
        },
      );

    // Un listado/búsqueda sin resultados es un 200 con data:[], nunca un 404 — un cliente HTTP
    // no debería tratar "sin resultados" como error (ver "Lecciones de la auditoría comparativa
    // con portal-comercios-backend" más abajo; auditado 2026-07-22, TekoApp-Backend no repite
    // este anti-patrón en ningún endpoint real hoy).
    return {
      data: rawOrders.map((order) =>
        CustomerDBHelper.mapToCustomersResponse(order),
      ),
      pagination,
    };
  }
  ```

- No barrel exports in large libraries (tree-shaking)
- Use helpers to reduce code in services (api o module) for mapping, formatting, and auxiliary functions whenever possible. If local, create a folder (if it doesn't exist) and a helper file (if it doesn't exist; if it does, consider reusing and adding the methods) in the context of the service you're working on.
- Create interceptors or middleware whenever necessary to avoid transforming the request in the controller where applicable, for example, buffered file responses for - download, cookie responses, receiving files or data from the request manipulated from Express, and where applicable, with their respective decorator.
- Use ! in the dto definition, for example: name!: string;
- Use `.pipe` with `handleHttpErrors` to handle `firstValueFrom` errors in `rxjs` 
- Use _declare_, example: `declare pagination: PaginationResponseDTO;`
- Use the _PaginatedRequest_ and _PaginatedResponse_ class as an extension in list classes that require pagination, for example: GetUsersListQueryDTO
  - Example:

  ```typescript
  export class GetBranchRequestListQueryDTO extends PaginatedRequest<GetBranchRequestListQueryDTO> {
    @ApiPropertyOptional({
      description: 'Código del comercio',
      required: false,
    })
    @IsString({
      message: 'El código del comercio debe ser una cadena de texto',
    })
    @IsNotEmpty({ message: 'El Código de comercios no puede venir vacio.' })
    @IsOptional()
    merchantCode?: string;

    @ApiPropertyOptional({
      description: 'Código de la sucursal',
      required: false,
    })
    @IsString({
      message: 'El código de la sucursal debe ser una cadena de texto',
    })
    @IsNotEmpty({ message: 'El Código de sucursales no puede venir vacio.' })
    @IsOptional()
    branchCode?: string;

    @ApiPropertyOptional({ description: 'RUC del comercio', required: false })
    @IsString({ message: 'El RUC debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El RUC no puede venir vacio.' })
    @IsOptional()
    ruc?: string;
  }

  export class GetBranchListResponseDTO extends PaginatedResponse<GetBranchDetailResponseDTO> {
    @ApiProperty({
      description: 'Lista de comercios',
      type: [GetBranchDetailResponseDTO],
    })
    declare data: GetBranchDetailResponseDTO[];

    @ApiProperty()
    declare pagination: PaginationResponseDTO;
  }
  ```

  - _PaginatedRequest_ definition:

  ```typescript
  import { PaginationQueryDTO } from '@common/dtos/pagination.dto';

  export class PaginatedRequest<T> extends PaginationQueryDTO {
    declare filters: T;
  }
  ```

  - _PaginatedResponse_ definition:

  ```typescript
  import { PaginationResponseDTO } from '@common/dtos/pagination.dto';

  export class PaginatedResponse<T> {
    data!: T[];
    pagination!: PaginationResponseDTO;
    additionalData?: {
      [key: string]: unknown;
    };
  }
  ```

  - _PaginationQueryDTO_ and _PaginationResponseDTO_ definition:

  ```typescript
  import { IsEndDateAfterStartDate } from '@common/validators/date-range.validator';
  import { IsOrderByFormat } from '@common/validators/is-order-by-format.validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { Transform, Type } from 'class-transformer';
  import {
    IsDate,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    Validate,
  } from 'class-validator';

  export class PaginationQueryDTO {
    @ApiPropertyOptional({
      description:
        'Pagina para paginación de resultados (opcional, por defecto 1)',
      example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
      description:
        'Pagina para paginación de resultados (opcional, por defecto 10)',
      example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize?: number;

    @ApiPropertyOptional({
      description:
        'Campo por el cual ordenar los resultados (opcional, por defecto "fechaHora") y orden ascendente o descendente (opcional, por defecto "DESC"), separados por :',
      example: 'tradeName:desc',
    })
    @IsOptional()
    @IsString()
    @Validate(IsOrderByFormat)
    orderBy?: string;

    @ApiPropertyOptional({
      description: 'Fecha de rango de inicio de consulta',
    })
    @IsOptional()
    @IsDate()
    @Transform(({ value }) =>
      value ? new Date(`${value}T00:00:00`) : undefined,
    )
    startDate?: Date;

    @ApiPropertyOptional({ description: 'Fecha de rango de fin de consulta' })
    @IsOptional()
    @IsDate()
    @Transform(({ value }) =>
      value ? new Date(`${value}T23:59:59.999`) : undefined,
    )
    @Validate(IsEndDateAfterStartDate)
    endDate?: Date;
  }

  export class PaginationResponseDTO {
    @ApiProperty({
      description: 'Total de elementos encontrados.',
      example: 100,
    })
    @Type(() => Number)
    @IsNumber()
    total!: number;

    @ApiProperty({
      description:
        'Pagina para paginación de resultados (opcional, por defecto 1)',
      example: 1,
    })
    @Type(() => Number)
    @IsNumber()
    page!: number;

    @ApiProperty({
      description:
        'Pagina para paginación de resultados (opcional, por defecto 1).',
      example: 2,
    })
    @Type(() => Number)
    @IsNumber()
    pageSize?: number;

    @ApiProperty({
      description: 'Total de paginas disponibles.',
      example: 2,
    })
    @Type(() => Number)
    @IsNumber()
    totalPages!: number;
  }
  ```
- SIEMPRE solucionar hasta el más minimo mensaje debe quedar clean 0 WARNINGS y 0 ERRORES tanto de test, format o lint.

## Lecciones de integración real (encontradas probando contra la DB real, no solo mocks de test)

- **Campos `Decimal` de Prisma serializan como su objeto interno crudo `{s,e,d}`** (no como
  number) al pasar por `ClassSerializerInterceptor` cuando el controller devuelve un objeto crudo
  de Prisma `as unknown as DTO` (el patrón normal de este proyecto, sin mapeo field-a-field). Ya
  está resuelto de forma centralizada en `core/database/services/prisma.service.ts` (el `$extends`
  normaliza cualquier valor Decimal-like a `number` en el resultado crudo de cada query) — no hace
  falta nada extra al agregar un modelo/campo `Decimal` nuevo, es universal. OJO: la detección es
  por duck-typing (`toNumber` + `s`/`e`/`d`), nunca `instanceof Prisma.Decimal` — ese instanceof
  falla en silencio (el cliente generado empaqueta su propia copia de decimal.js) y el fallback
  de "objeto genérico" reconstruye exactamente el mismo `{s,e,d}` roto si no se detecta bien.
- Los tests unitarios (mocks de Prisma) NUNCA ejercitan el `$extends` real — si se toca esa
  lógica, probar contra una DB real, no solo `pnpm test`.
- Antes de agregar un campo obligatorio nuevo a un DTO de response usado por un mapper explícito
  (no solo cast crudo), revisar TODOS los call sites del mapper — `roles-permission` reusaba
  `permissionToResponse()` para Roles en 3 de 4 métodos por error (`roleToResponse()` existía y
  nunca se llamaba); el compilador lo detectó recién al agregar `referenceId` como campo requerido.

## Lecciones de la limpieza de schema + migración init unificada (2026-07-21/22)

- **Nunca confiar en un hallazgo de auditoría sobre comportamiento de Postgres sin verificarlo
  contra una DB real.** Una auditoría previa reportó que el trigger genérico de auditoría
  "rompía toda operación DELETE" por referenciar `NEW` sin asignar — sonaba plausible pero era
  falso: un trigger combinado `BEFORE INSERT OR UPDATE OR DELETE` en Postgres SÍ provee `NEW`/`OLD`
  como registros válidos (con valor NULL para el que no aplica) para el patrón
  `COALESCE(NEW.x, OLD.x)` — es el patrón oficial de la wiki de Postgres para triggers de
  auditoría genéricos. Se verificó creando una tabla scratch con el trigger real y ejecutando
  INSERT/UPDATE/DELETE antes de tocar una sola línea de la función — evitó reescribir algo que
  no estaba roto. Los bugs reales SÍ confirmados empíricamente: `aud_version` no incrementaba en
  DELETE, tablas con PK natural sin columna `id` (ej. `Currency`) rompen el trigger genérico
  (`record "new" has no field "id"`), y tablas sin columna `created_by` (ej. `Promotion`, que solo
  tenía `createdById` como FK) rompen igual.
- **La función de trigger `fn_audit_generic_trigger()` NUNCA debe pisar `created_at`/
  `last_changed_at` si el caller ya los seteó explícitamente** (ej. seeds, backfills, migraciones
  de datos históricos). Patrón correcto: `IF NEW.created_at IS NULL THEN ... := CURRENT_TIMESTAMP`
  en INSERT (nunca incondicional), y `IF NEW.last_changed_at IS NOT DISTINCT FROM OLD.last_changed_at
  THEN ... := CURRENT_TIMESTAMP` en UPDATE (compara contra OLD, no contra NULL, porque Postgres ya
  trae el valor previo en NEW para columnas no tocadas por el UPDATE) — esto preserva el
  auto-stamping normal cuando el caller no toca el campo, y respeta un valor explícito cuando sí lo
  toca. Mismo patrón ya existente para `created_by`/`last_changed_by`, ahora extendido a las fechas.
- **El pepper de firma del audit trigger (`v_secret_key`) nunca debe estar hardcodeado en el SQL
  de la migración** (quedaba en git en texto plano) — se lee de una GUC de sesión
  (`current_setting('app.audit_secret_pepper', true)`) que setea `PrismaDatasource#extended` vía
  `set_config` (mismo mecanismo ya usado para `app.current_user_id`/`app.client_ip`), con el valor
  real viniendo de `APP_CONFIG.database.auditSecretPepper` (env var `AUDIT_SECRET_PEPPER`,
  validada en `config-schema.ts`). El fallback hardcodeado solo cubre conexiones fuera de la app
  (psql manual) y está marcado explícitamente como `CHANGE_ME`.
- **La asociación trigger↔tabla es una función SQL reusable e idempotente**
  (`fn_attach_audit_triggers()`), no un `DO $$ ... $$` de una sola vez — requiere que la tabla
  tenga `id` + `created_by` + `change_signature` (no solo `change_signature`) para calificar, lo
  que excluye automáticamente catálogos con PK natural (`Currency`, PK=`alpha_code`) sin necesitar
  una excepción manual por nombre de tabla. Volver a invocar `SELECT fn_attach_audit_triggers();`
  después de agregar una tabla nueva que necesite auditoría — Prisma no tiene hook post-migración
  para SQL crudo.
- **Al eliminar un campo "muerto" de `schema.prisma`, grepear TODO el repo (`src/`, no solo el
  código de producción) antes de confirmar que está muerto** — `access_level`/`legacyUserId`
  aparecían en 3 sitios de escritura reales (`users-db.service.ts`, `onboarding.service.ts`,
  `seed.ts`) y en ~8 archivos `.spec.ts` como parte de objetos mock tipados `Users` (rompen con
  "excess property" al remover el campo del tipo generado). El build/lint pasando no detecta specs
  con mocks NO usados directamente como el tipo (ver el caso de `seed.ts`, que no corre en
  build/test normal — solo lo detectó `pnpm run seed`).

## Lecciones de la auditoría comparativa con portal-comercios-backend (2026-07-21)

- **Transiciones de estado (`status`) SIEMPRE vía `updateMany({ where: { id, status: { in:
  [ESTADOS_VÁLIDOS] } }, data: {...} })` + chequear `count === 0` → `ConflictException`** — nunca
  `findUnique` + validar en código + `update()` plano incondicional (patrón TOCTOU: dos requests
  concurrentes pueden pasar ambas la validación inicial antes de que la primera escriba). Gap real
  confirmado hoy en `services.service.ts` (`acceptService`/`startService`/`completeService`/
  `cancelService`/`respondToServiceRequest`), `payments.service.ts` (`cancelPayment`/
  `refundPayment` — riesgo de doble reembolso si corre en paralelo con el webhook) y
  `promotions.service.ts` (`applyPromotion`/`validatePromotion` — `maxUsage` puede excederse con
  redenciones concurrentes). Retrofit pendiente, priorizar `payments.service.ts` primero (dinero
  real en juego) — ver memoria de proyecto para el backlog completo.
- **Nunca lanzar `NotFoundException` cuando un endpoint de listado/búsqueda da 0 resultados** —
  responder `200` con `data: []`. Un cliente HTTP no debería tratar "sin resultados" como error.
  Verificado 2026-07-22: el anti-patrón NO existe en ningún endpoint real de este proyecto hoy —
  solo estaba en el ejemplo de `PrismaPaginationUtil` de este archivo (ya corregido arriba). Se
  audita todo `src/api/**/services/*.ts` y se confirmó que cada `NotFoundException` es una
  búsqueda legítima de una sola entidad por id/código/slug, nunca un listado vacío.
- **En `config-schema.ts`, usar siempre `Joi.valid(...)` para restringir un campo a un enum de
  valores — nunca `Joi.allow(...)`**, que solo AGREGA valores permitidos sin restringir nada sobre
  un tipo ya válido (`Joi.string().allow('a','b')` deja pasar cualquier string). Bug real
  encontrado y corregido en `NODE_ENV`/`SEQ_ENABLED` (además, `.required()` + `.default()` juntos
  en el mismo campo es contradictorio — usar uno u otro).
- **Toda tabla de entidad de negocio nueva debe evaluarse para el patrón `id` secuencial interno
  (`Int`/`BigInt autoincrement`, nunca expuesto) + `referenceId` público separado** — no usar UUID
  como PK primaria salvo justificación explícita. `Services`/`ServiceRequests`/`PaymentMethodEntity`/
  `Payments`/`PaymentTransaction`/`Rating` hoy usan UUID como PK (`@default(uuid())` client-side, no
  `dbgenerated`), decisión ya tomada y con FKs en cascada — migrar es un refactor grande, no hacerlo
  sin decidirlo explícitamente primero (ver memoria de proyecto).
- **Checklist de cierre obligatorio, no solo una línea suelta**: antes de reportar cualquier tarea
  como terminada, correr `pnpm run format` (si existe) y `pnpm run lint` (con `--fix`), y
  **prohibido reportar "completado" si el lint queda en rojo** — no alcanza con la intención, hay
  que verificar el resultado del comando.