# Sesión 7 — 2026-06-09: Tests de controllers

## Estado al iniciar
- Build OK, 0 lint, 239 tests PASS (16 suites)
- Sin specs de controllers en ningún módulo api

## Trabajo realizado

### 6 specs de controllers creados

| Archivo | Tests | Guards mockados |
|---------|-------|-----------------|
| `api/analytics/controllers/analytics.controller.spec.ts` | 4 | ninguno |
| `api/locations/controllers/locations.controller.spec.ts` | 8 | JwtAuthGuard (solo POST /update) |
| `api/professionals/controllers/professionals.controller.spec.ts` | 15 | JwtAuthGuard (clase) |
| `api/ratings/controllers/ratings.controller.spec.ts` | 16 | JwtAuthGuard (clase) |
| `api/services/controllers/services.controller.spec.ts` | 16 | JwtAuthGuard (clase) |
| `api/users/controllers/users.controller.spec.ts` | 10 | JwtAuthGuard, PermissionsGuard, MerchantContextGuard |

### Casos edge verificados
- `calculateDistance` es SÍNCRONO — no usar `await`, resultado envuelto en `{ distance, unit: 'km' }` con `Math.round`
- `getOnlineProfessionalsCount` envuelve resultado en `{ count }`
- `updateAvailability` extrae `dto.isAvailable` (no el DTO completo)
- `cancelService` extrae `dto.reason`
- `getUserRatingStats` llama con `String(param.userId)` (conversión explícita)
- `remove` (ratings) retorna void con `@HttpCode(204)`
- `users.controller.ts` tiene `ParseIntPipe` inline (violación DTOs, no corregida — out of scope)
- `@User()` y `@MerchantContext()` decoradores de parámetro: se pasan directamente como args en tests

## Estado al cerrar
- Build OK, 0 lint, 311 tests PASS (22 suites)
