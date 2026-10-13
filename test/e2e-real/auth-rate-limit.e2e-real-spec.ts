/* eslint-disable */
/**
 * Suite: M1 Auth - rate limit de autenticación (max 5 intentos fallidos / 15 min, limiter `auth`).
 * Casos: CP-BE-AUTH-035, CP-BE-ERR-006 (ver test/qa/casos/CP-AUTH.md)
 * Tipo: e2e   Prioridad: P1
 * Precondiciones: stack e2e arriba. Fuerza RATE_LIMIT_MULTIPLIER=1 en process.env SOLO dentro de
 *        este archivo (la app se crea después del override) y limpia las claves `rl:*` de Redis
 *        antes y después, para no contaminar a los demás specs ni quedar bloqueado por ellos.
 *        Se usa Basic Auth inválido (401 del guard) para no bloquear cuentas fixture por intentos.
 * Trazabilidad: M1 del plan maestro; WORKPLAN platform-hardening D-02 (limiters de auth)
 */
import Redis from 'ioredis';
import {
  basic,
  bootApp,
  E2eApp,
  FIXTURE,
  PREFIX,
  WEB,
} from './helpers/e2e-app';

describe('M1 Auth - rate limit (multiplicador = 1)', () => {
  let ctx: E2eApp;
  let redis: Redis;
  const previous = process.env.RATE_LIMIT_MULTIPLIER;

  const clearLimiterKeys = async () => {
    const keys = await redis.keys('rl:*');
    if (keys.length) await redis.del(...keys);
  };

  beforeAll(async () => {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });
    await clearLimiterKeys();
    process.env.RATE_LIMIT_MULTIPLIER = '1';
    ctx = await bootApp();
  });

  afterAll(async () => {
    await ctx?.close();
    await clearLimiterKeys();
    await redis.quit();
    if (previous === undefined) delete process.env.RATE_LIMIT_MULTIPLIER;
    else process.env.RATE_LIMIT_MULTIPLIER = previous;
  });

  // CP-BE-AUTH-035
  it('el 6º intento de login tras 5 fallidos -> 429 (incluso con credenciales válidas)', async () => {
    const http = ctx.http;
    for (let i = 1; i <= 5; i++) {
      const res = await http
        .post(`${PREFIX}/auth/login`)
        .auth(WEB.user, 'secreto-incorrecto')
        .send({ email: FIXTURE.clienteB.email, encryptedPassword: 'x' });
      expect(res.status).toBe(401);
    }
    const sixth = await basic(http.post(`${PREFIX}/auth/login`)).send({
      email: FIXTURE.clienteB.email,
      encryptedPassword: 'x',
    });
    expect(sixth.status).toBe(429);
    // El bloqueo es por IP y compartido por el limiter: también corta el nonce.
    await basic(http.post(`${PREFIX}/auth/nonce`)).expect(429);
  });

  // CP-BE-ERR-006
  it('DEF-BE-005: el 429 debe usar el envelope {success:false,error:{code,message}}', async () => {
    const res = await basic(ctx.http.post(`${PREFIX}/auth/nonce`));
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(429);
  });
});
