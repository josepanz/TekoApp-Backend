/**
 * Suite: JwtRefreshStrategy.validate (usuario del refresh token)
 * Casos: CP-BE-AUTH-039 (ver test/qa/casos/CP-AUTH.md)
 * Tipo: unitaria   Prioridad: P2
 * Precondiciones: UsersDBService mockeado
 * Trazabilidad: DEF-BE-011 (hallazgo al implementar DEF-BE-006)
 */
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

describe('JwtRefreshStrategy.validate', () => {
  const findActiveUserByEmail = jest.fn();
  const strategy = new JwtRefreshStrategy(
    { findActiveUserByEmail } as never,
    { authentication: { publicKey: 'pk' } } as never,
  );

  afterEach(() => jest.clearAllMocks());

  // DEF-BE-011: el refresh token solo lleva `sub` (no `email`); la estrategia igual busca por
  // email => `where: { email: undefined }` en Prisma ignora el filtro y devuelve CUALQUIER
  // usuario activo, o sea que no valida al dueño del token (el service sí lo revalida por `sub`).
  it.failing(
    'DEF-BE-011: no debe consultar usuarios por un email undefined',
    async () => {
      findActiveUserByEmail.mockResolvedValue({ id: 1 });

      await strategy
        .validate({ sub: 'ref-1', tokenType: 'refreshToken' } as never)
        .catch(() => undefined);

      expect(findActiveUserByEmail).not.toHaveBeenCalledWith(undefined);
    },
  );
});
