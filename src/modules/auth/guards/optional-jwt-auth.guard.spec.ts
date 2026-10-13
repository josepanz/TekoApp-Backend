/**
 * Suite: OptionalJwtAuthGuard (autenticación opcional, nunca rechaza)
 * Casos: CP-BE-CAT-016 / 016b (ver test/qa/casos/CP-CAT.md)
 * Tipo: unitaria   Prioridad: P1
 * Precondiciones: ninguna
 * Trazabilidad: DEF-BE-008
 */
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard.handleRequest', () => {
  const guard = new OptionalJwtAuthGuard();

  it('devuelve el usuario cuando el token es válido', () => {
    const user = { id: 1 };
    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it.each([
    ['sin token', null, false],
    ['token inválido o vencido', new Error('jwt expired'), false],
    ['usuario inexistente', null, undefined],
  ])('%s: no lanza y deja al request como anónimo', (_n, err, user) => {
    expect(guard.handleRequest(err, user)).toBeUndefined();
  });
});
