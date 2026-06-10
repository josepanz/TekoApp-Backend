# Sesión 11 — 2026-06-09 — Lint limpio: 0 errors, 0 warnings

## Qué se hizo

- Corregidos **28 errores** de ESLint que bloqueaban exit code 0 en `pnpm lint --fix`
- Eliminados **107 warnings** → llegando a **0 errors, 0 warnings** total
- Actualizada `rules/test.md`: nueva regla explícita "0 WARNINGS y 0 ERRORES siempre"

## Errores corregidos (28)

| Regla | Archivos | Fix aplicado |
|-------|----------|--------------|
| `no-unused-vars` | `analytics-db.spec`, `users-db.spec`, `user-permissions-db.spec` | Removed unused imports (`UserStatus`, `UserProfileStatus`, `Prisma`, variable `mockUserPermissionsFindManyByPermissionId`) |
| `unbound-method` (7) | `auth-password.service.spec` | `eslint-disable-next-line` antes de `expect(CryptoHelper.decrypt/compareHashes/hashValue)` |
| `unbound-method` (3) | `auth-token.service.spec` | `eslint-disable-next-line` antes de `expect(CryptoHelper.generateToken)` |
| `unbound-method` (6) | `email.service.spec` | `eslint-disable-next-line` antes de `expect(CryptoHelper/EmailHelper)` |
| `unbound-method` (1) | `professionals-db.service.spec` | `eslint-disable-next-line` antes de `PrismaPaginationUtil.paginate as jest.MockedFunction` |
| `require-await` + `no-unsafe-return` + `no-unsafe-call` (×3) | `role-permissions-db.spec`, `user-permissions-db.spec`, `user-roles-db.spec` | Removido `async`, tipado `cb: (tx: typeof mockTx) => unknown` |
| `no-unsafe-return` (1) | `email.service.spec` | Retorno de `buildUser()` cambiado a `as unknown as Users` |

## Warnings eliminados (107)

| Patrón | Archivos afectados | Fix |
|--------|-------------------|-----|
| `buildUser() as any` pasado a service | `auth.service.spec`, `email.service.spec`, `auth-token.spec`, `auth-password.spec` | `buildUser(): Users { return { ... } as unknown as Users }` — importar `Users` de `@prisma/client` |
| `{} as any` pasado como DTO | `roles-api.controller.spec`, `users-roles-api.spec`, `permissions-db.spec`, `roles-db.spec` | Reemplazar con `{} as GetXxxQueryDTO` |
| `const result = await service.method()` inferred `any` | Todos los `-db.service.spec` | Declarar tipo explícito: `const result: ReturnType = ...` |
| `result[0]` en array `any` | `analytics-db.spec`, `locations-db.spec`, `health.controller.spec` | Tipar como `unknown[]` y castear: `(calls as unknown[][])[0]` |
| `expect.objectContaining()` / `expect.any()` como valor de propiedad | `user-roles-db.spec`, `users-db.spec`, `roles-db.spec`, `promotions-db.spec` | Agregar `as unknown` al final: `expect.objectContaining({...}) as unknown` |
| Variables intermedias `as unknown as jest.ObjectContaining` | `promotions-db.service.spec` | Inline los matchers + `as unknown` en cada nivel |

## Decisiones clave aprendidas

### `unbound-method` en Jest — solo con métodos estáticos mockeados
- La regla `unbound-method` se dispara cuando se accede a métodos de clase (`CryptoHelper.decrypt`) como propiedad en `expect()`
- Cuando la clase **entera** está mockeada con `jest.mock()`, no hay riesgo real de `this` binding
- Fix correcto: `// eslint-disable-next-line @typescript-eslint/unbound-method` — NO cambiar el patrón de test
- **Nunca aplica** a mock functions `const mockXxx = jest.fn()` — esas no disparan la regla

### `expect.objectContaining()` como valor de propiedad
- `data: expect.objectContaining({...})` dispara `no-unsafe-assignment` porque el tipo retornado por `objectContaining` contiene `any` en `@types/jest`
- **Fix**: `data: expect.objectContaining({...}) as unknown`
- Aplica en CUALQUIER posición de propiedad: `data:`, `where:`, `update:`, `create:`, `OR:`
- NO aplica cuando es el argumento directo de `toHaveBeenCalledWith(expect.objectContaining({...}))` — ahí va bien

### `expect.any(...)` como valor de propiedad
- Mismo problema: `data: { lastLogin: expect.any(Date) }` dispara `no-unsafe-assignment`
- Fix: `data: { lastLogin: expect.any(Date) as unknown }`

### Transaction mocks — tipado correcto
```typescript
// ❌ Incorrecto — dispara require-await + no-unsafe-return + no-unsafe-call
const mockTransaction = jest.fn().mockImplementation(async (cb) => cb(mockTx));

// ✅ Correcto
const mockTransaction = jest.fn().mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx));
```

### Fixtures de usuario (`buildUser`)
```typescript
// ❌ Incorrecto
function buildUser() { return { ... } as any; }

// ✅ Correcto
import { Users } from '@prisma/client';
function buildUser(overrides: Record<string, unknown> = {}): Users {
  return { id: 1, email: '...', ... , ...overrides } as unknown as Users;
}
```

## Archivos modificados

### Corregidos manualmente
- `src/modules/analytics-db/services/analytics-db.service.spec.ts`
- `src/modules/users-db/services/users-db.service.spec.ts`
- `src/modules/roles-permission-db/services/role-permissions-db.service.spec.ts`
- `src/modules/roles-permission-db/services/user-roles-db.service.spec.ts`
- `src/modules/roles-permission-db/services/user-permissions-db.service.spec.ts`
- `src/modules/professionals-db/services/professionals-db.service.spec.ts`
- `src/modules/auth/services/auth-password.service.spec.ts`
- `src/modules/auth/services/auth-token.service.spec.ts`
- `src/modules/email/services/email.service.spec.ts`

### Corregidos vía workflow (20 agentes paralelos)
- `src/api/roles-permission/controllers/roles-api.controller.spec.ts`
- `src/api/roles-permission/controllers/users-roles-api.controller.spec.ts`
- `src/api/roles-permission/services/roles-permission-api.service.spec.ts`
- `src/api/tracking/controllers/tracking.controller.spec.ts`
- `src/modules/auth/services/auth.service.spec.ts`
- `src/modules/health/health.controller.spec.ts`
- `src/modules/locations-db/services/locations-db.service.spec.ts`
- `src/modules/onboarding/services/onboarding.service.spec.ts`
- `src/modules/payments-db/services/payment-db.service.spec.ts`
- `src/modules/promotions-db/services/promotions-db.service.spec.ts`
- `src/modules/roles-permission-db/services/permissions-db.service.spec.ts`
- `src/modules/roles-permission-db/services/roles-db.service.spec.ts`
- `src/modules/users-db/services/user-roles-db.service.spec.ts`

### Reglas actualizadas
- `.claude/rules/test.md` — añadida regla: "0 WARNINGS y 0 ERRORES tanto de test, format o lint"
- `.claude/rules/typescript.md` — actualización menor

## Estado al cerrar

`pnpm eslint "{src,apps,libs,test}/**/*.ts"` → **exit 0, 0 errors, 0 warnings**.
Build y tests sin cambiar — misma cobertura que sesión 10 (843 tests).
