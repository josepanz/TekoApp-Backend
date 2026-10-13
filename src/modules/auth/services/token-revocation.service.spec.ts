/**
 * Suite: TokenRevocationService (denylist de refresh tokens por jti en Redis)
 * Casos: CP-BE-AUTH-027, 036..038 (ver test/qa/casos/CP-AUTH.md)
 * Tipo: unitaria   Prioridad: P1
 * Precondiciones: cliente Redis mockeado
 * Trazabilidad: DEF-BE-006
 */
import { TokenRevocationService } from './token-revocation.service';

describe('TokenRevocationService', () => {
  const redis = { set: jest.fn(), exists: jest.fn() };
  const service = new TokenRevocationService(redis as never);

  afterEach(() => jest.clearAllMocks());

  it('revoke guarda revoked:jti:<jti> con TTL en segundos (mínimo 1)', async () => {
    await service.revoke('abc', 90.2);
    await service.revoke('def', 0);

    expect(redis.set).toHaveBeenNthCalledWith(
      1,
      'revoked:jti:abc',
      '1',
      'EX',
      91,
    );
    expect(redis.set).toHaveBeenNthCalledWith(
      2,
      'revoked:jti:def',
      '1',
      'EX',
      1,
    );
  });

  it('revoke propaga el error de Redis (logout fail-closed)', async () => {
    redis.set.mockRejectedValue(new Error('down'));

    await expect(service.revoke('abc', 10)).rejects.toThrow('down');
  });

  it('isRevoked devuelve true/false según exista la clave', async () => {
    redis.exists.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(service.isRevoked('a')).resolves.toBe(true);
    await expect(service.isRevoked('b')).resolves.toBe(false);
    expect(redis.exists).toHaveBeenCalledWith('revoked:jti:a');
  });

  it('isRevoked es fail-open: con Redis caído devuelve false', async () => {
    redis.exists.mockRejectedValue(new Error('down'));

    await expect(service.isRevoked('a')).resolves.toBe(false);
  });
});
