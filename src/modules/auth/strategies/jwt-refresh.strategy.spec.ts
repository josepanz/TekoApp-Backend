/**
 * Suite: JwtRefreshStrategy.validate (usuario del refresh token)
 * Casos: CP-BE-AUTH-039 (ver test/qa/casos/CP-AUTH.md)
 * Tipo: unitaria   Prioridad: P2
 * Precondiciones: UsersDBService mockeado
 * Trazabilidad: DEF-BE-011 (hallazgo al implementar DEF-BE-006)
 */
import { UnauthorizedException } from '@nestjs/common';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

describe('JwtRefreshStrategy.validate', () => {
  const findActiveUserByEmail = jest.fn();
  const findActiveUserByReferenceId = jest.fn();
  const strategy = new JwtRefreshStrategy(
    { findActiveUserByEmail, findActiveUserByReferenceId } as never,
    { authentication: { publicKey: 'pk' } } as never,
  );

  afterEach(() => jest.clearAllMocks());

  // DEF-BE-011: el refresh token solo lleva `sub` (no `email`); la estrategia debe resolver
  // al usuario por `sub` y nunca consultar por un email undefined.
  it('DEF-BE-011: no debe consultar usuarios por un email undefined', async () => {
    findActiveUserByReferenceId.mockResolvedValue({ id: 1 });

    await strategy.validate({
      sub: 'ref-1',
      tokenType: 'refreshToken',
    } as never);

    expect(findActiveUserByEmail).not.toHaveBeenCalled();
    expect(findActiveUserByReferenceId).toHaveBeenCalledWith('ref-1');
  });

  it('devuelve el usuario resuelto por sub', async () => {
    findActiveUserByReferenceId.mockResolvedValue({ id: 7 });

    await expect(
      strategy.validate({ sub: 'ref-7', tokenType: 'refreshToken' } as never),
    ).resolves.toEqual({ id: 7 });
  });

  it('lanza Unauthorized si el usuario no existe o no está activo', async () => {
    findActiveUserByReferenceId.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'ref-x', tokenType: 'refreshToken' } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lanza Unauthorized si el payload no trae sub, sin consultar la BD', async () => {
    await expect(
      strategy.validate({ tokenType: 'refreshToken' } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findActiveUserByReferenceId).not.toHaveBeenCalled();
  });
});
