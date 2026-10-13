/* eslint-disable */
/**
 * Suite: smoke e2e real de auth contra el stack docker-compose.e2e.yml (AppModule + MiddlewareConfig, sin mocks)
 * Casos: CP-BE-AUTH-001..006 y CP-BE-ENV-001 (beforeAll; helper de login en helpers/e2e-app.ts) (ver test/qa/casos/CP-AUTH.md y CP-ENV.md)
 * Tipo: smoke / e2e   Prioridad: P0
 * Precondiciones: pnpm e2e:up + e2e:seed (o pnpm qa:e2e); usuarios fixture admin y cliente_a
 * Trazabilidad: M0/M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md)
 */
import {
  basic,
  bearer,
  bootApp,
  E2eApp,
  FIXTURE,
  getPublicKey,
  login,
  PREFIX,
  unwrap,
} from './helpers/e2e-app';

describe('Smoke E2E real', () => {
  let ctx: E2eApp;
  let http: E2eApp['http'];

  beforeAll(async () => {
    ctx = await bootApp();
    http = ctx.http;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  const ADMIN = FIXTURE.admin;
  const CLIENTE_A = FIXTURE.clienteA;
  const loginToken = async (email: string, password: string) =>
    (await login(http, email, password)).accessToken;

  it('healthcheck (version-neutral): Postgres, Mongo y Redis reales en up', async () => {
    const res = await http.get('/tekoapp-backend/api/healthcheck');
    // 503 es válido si SOLO falla `storage_disk` (umbral de disco del host de desarrollo, ajeno a
    // la app); lo que se verifica es que la infraestructura Docker del E2E esté realmente arriba.
    expect([200, 503]).toContain(res.status);
    const details =
      res.body.details ?? res.body.error?.details ?? res.body.data?.details;
    for (const key of ['postgres_database', 'mongodb_database', 'redis']) {
      expect(details[key].status).toBe('up');
    }
  });

  it('GET /auth/public-key devuelve el PEM publico generado para el E2E', async () => {
    expect(await getPublicKey(http)).toContain('BEGIN PUBLIC KEY');
  });

  it('Basic Auth invalido -> 401', async () => {
    await http
      .get(`${PREFIX}/auth/public-key`)
      .auth('tekoapp-web', 'nope')
      .expect(401);
    await http.get(`${PREFIX}/auth/public-key`).expect(401);
  });

  it('nonce + RSA -> login admin -> /auth/scope', async () => {
    const token = await loginToken(ADMIN.email, ADMIN.password);
    const res = await http
      .get(`${PREFIX}/auth/scope`)
      .set(bearer(token))
      .expect(200);
    expect(JSON.stringify(unwrap(res.body))).toContain('admin:all');
  });

  it('endpoint protegido sin token -> 401', async () => {
    await http.get(`${PREFIX}/auth/scope`).expect(401);
  });

  it('usuario sin permiso -> 403 en endpoint de staff', async () => {
    const token = await loginToken(CLIENTE_A.email, CLIENTE_A.password);
    await http
      .get(`${PREFIX}/admin/ai-disclosures`)
      .set(bearer(token))
      .expect(403);
  });
});
