/* eslint-disable */
/**
 * Suite: contrato de error uniforme de la API (400/401/403/404/409 comparten forma
 * {success:false, error:{code, message, error, timestamp, path}}). Las desviaciones son defectos
 * registrados (it.failing con DEF-BE), no se corrigen en esta rama.
 * Casos: CP-BE-ERR-001..005 (el 429 es CP-BE-ERR-006 en auth-rate-limit.e2e-real-spec.ts)
 *        (ver test/qa/casos/CP-AUTH.md)
 * Tipo: e2e   Prioridad: P1
 * Precondiciones: stack e2e arriba y sembrado; fixtures admin y cliente_a.
 * Trazabilidad: M1/M2 del plan maestro; hallazgo transversal de contrato de error
 */
import request = require('supertest');
import {
  basic,
  bearer,
  bootApp,
  E2eApp,
  E2E_PASSWORD,
  FIXTURE,
  getPublicKey,
  login,
  PREFIX,
  rsaEncrypt,
  uniqueSuffix,
} from './helpers/e2e-app';

const HTTP_NAME: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
};

describe('Contrato de error uniforme (e2e real)', () => {
  let ctx: E2eApp;
  let http: E2eApp['http'];
  let pem: string;
  let cliente: string;

  beforeAll(async () => {
    ctx = await bootApp();
    http = ctx.http;
    pem = await getPublicKey(http);
    cliente = (
      await login(http, FIXTURE.clienteA.email, FIXTURE.clienteA.password)
    ).accessToken;
  });
  afterAll(async () => {
    await ctx?.close();
  });

  const onboard = (email: string, confirm = E2E_PASSWORD) =>
    basic(http.post(`${PREFIX}/onboarding`)).send({
      firstName: 'Err',
      lastName: 'Contrato',
      email,
      phoneNumber: '0981555111',
      password: rsaEncrypt(pem, E2E_PASSWORD),
      confirmPassword: rsaEncrypt(pem, confirm),
      acceptTerms: true,
    });

  const triggers: Array<[number, string, () => request.Test]> = [
    [
      400,
      'onboarding con passwords distintas',
      () =>
        onboard(`err_${uniqueSuffix()}@e2e.tekoapp.local`, 'Otra-Passw0rd!1'),
    ],
    [
      401,
      'endpoint protegido sin token',
      () => http.get(`${PREFIX}/auth/scope`),
    ],
    [
      403,
      'cliente en endpoint admin',
      () => http.get(`${PREFIX}/admin/ai-disclosures`).set(bearer(cliente)),
    ],
    [
      404,
      'categoría inexistente',
      () => http.get(`${PREFIX}/categories/999999`),
    ],
    [
      409,
      'onboarding con email duplicado',
      () => onboard(FIXTURE.clienteA.email),
    ],
  ];

  // CP-BE-ERR-001..005: forma común (success/code/message/timestamp/path).
  it.each(triggers)(
    '%i (%s): envelope {success:false, error:{code,message,timestamp,path}}',
    async (status, _label, call) => {
      const res = await call();
      expect(res.status).toBe(status);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(status);
      expect(typeof res.body.error.message).toBe('string');
      expect(res.body.error.message.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(res.body.error.timestamp))).toBe(false);
      expect(res.body.error.path).toContain(PREFIX);
    },
  );

  // CP-BE-ERR-007: 401/403/404/409 incluyen el nombre HTTP en error.error.
  it.each(triggers.filter(([s]) => s !== 400))(
    '%i (%s): error.error con el nombre HTTP',
    async (status, _label, call) => {
      const res = await call();
      expect(res.body.error.error).toBe(HTTP_NAME[status]);
    },
  );

  // CP-BE-ERR-008
  it('DEF-BE-007: el 400 debe incluir error.error "Bad Request" como el resto', async () => {
    const res = await triggers[0][2]();
    expect(res.body.error.error).toBe('Bad Request');
  });

  // CP-BE-ERR-009
  it('DEF-BE-001: un body inválido debe usar el mismo envelope de error', async () => {
    const res = await basic(http.post(`${PREFIX}/onboarding`)).send({
      email: 'nope',
    });
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(res.status);
  });
});
