## Reglas de testing

- SIEMPRE generar o actualizar el archivo `.spec.ts` cuando se crea o modifica un servicio.
- NUNCA usar datos reales (IDs de producción, tokens reales) en tests.
- SIEMPRE usar `jest.clearAllMocks()` en `afterEach`.
- SIEMPRE mockear dependencias externas; nunca llamar servicios reales en unit tests.
- Los nombres de tests deben estar en español y describir el COMPORTAMIENTO esperado, no el método.
  - ❌ `it('llama a prisma.create')`
  - ✅ `it('debe retornar el usuario creado con su ID generado')`

## Patrón AAA (obligatorio)

Cada test debe seguir Arrange / Act / Assert — nunca mezclar las tres fases en una sola línea.

```typescript
it('debe lanzar NotFoundException si el usuario no existe', async () => {
  // Arrange
  mockFindUser.mockResolvedValue(null);

  // Act & Assert
  await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
});
```

## Mocks de dependencias — regla de scope

SIEMPRE declarar las funciones mock como variables `const` independientes a nivel de módulo. Nunca inline `jest.fn()` dentro de `useValue`. Esto evita el error `@typescript-eslint/unbound-method`.

```typescript
// ✅ Correcto
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();

{ provide: UsersDbService, useValue: { create: mockCreate, findUnique: mockFindUnique } }

expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com' }));

// ❌ Incorrecto — dispara unbound-method lint
let service: jest.Mocked<UsersDbService>;
expect(service.create).toHaveBeenCalledWith(...);
```

## Mocks reutilizables

Los mocks compartidos viven en `test/mocks/`:

- `test/mocks/prisma.mock.ts` → mock de PrismaService / PrismaDatasource
- `test/mocks/http.mock.ts` → mock de HttpService para llamadas inter-servicio
- `test/mocks/checkout.mock.ts` → mock del proveedor de checkout
- `test/mocks/sequelize.mock.ts` → mock de Sequelize (módulo acquiring)

Reutilizar estos mocks en lugar de recrearlos en cada `.spec.ts`.

## Guards en tests de controllers

Mockear todos los guards con `.overrideGuard()`:

```typescript
.overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn().mockReturnValue(true) })
```

## Comandos

- `pnpm run test` — ejecutar todos los tests
- `pnpm run test:watch` — modo watch para desarrollo
- `pnpm run test:cov` — generar reporte de cobertura
- `pnpm run test:e2e` — tests end-to-end
- `pnpm run test -- <ruta/archivo.spec.ts> --no-coverage` — ejecutar un test específico
