/* eslint-disable */
/**
 * Suite: M1 Auth y sesión contra el stack real (registro, login, scope, refresh, Basic Auth
 * pre-login, guards de permisos, rol COMPLIANCE). Defectos de producto marcados `it.failing`
 * con su DEF-BE en el nombre (no se corrige código de producto en esta rama).
 * Casos: CP-BE-AUTH-007..034 (ver test/qa/casos/CP-AUTH.md). El rate-limit vive en
 *        auth-rate-limit.e2e-real-spec.ts (CP-BE-AUTH-035) y la forma de error en
 *        error-contract.e2e-real-spec.ts (CP-BE-ERR-001..).
 * Tipo: e2e   Prioridad: P0/P1
 * Precondiciones: pnpm e2e:up + e2e:seed (o pnpm qa:e2e); fixtures admin, cliente_a/b,
 *        pro_aprobado/pendiente y compliance. Los emails de registro son únicos por corrida.
 * Trazabilidad: M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3), openspec/specs/e2e-test-plan.md Tier 1
 */
import { sign } from 'jsonwebtoken';
import {
  bearer,
  basic,
  bootApp,
  E2eApp,
  E2E_PASSWORD,
  FIXTURE,
  getNonce,
  getPublicKey,
  login,
  MOBILE,
  PREFIX,
  rawLogin,
  rsaEncrypt,
  uniqueSuffix,
  unwrap,
  WEB,
} from './helpers/e2e-app';

describe('M1 Auth y sesión (e2e real)', () => {
  let ctx: E2eApp;
  let http: E2eApp['http'];
  let pem: string;

  beforeAll(async () => {
    ctx = await bootApp();
    http = ctx.http;
    pem = await getPublicKey(http);
  });
  afterAll(async () => {
    await ctx?.close();
  });

  const onboardingBody = (
    email: string,
    password = E2E_PASSWORD,
    confirm = password,
  ) => ({
    firstName: 'Reg',
    lastName: 'Prueba',
    email,
    phoneNumber: '0981555000',
    password: rsaEncrypt(pem, password),
    confirmPassword: rsaEncrypt(pem, confirm),
    acceptTerms: true,
  });
  const newEmail = () => `reg_${uniqueSuffix()}@e2e.tekoapp.local`;

  describe('Registro POST /onboarding', () => {
    // CP-BE-AUTH-007
    it('registra un usuario nuevo (201, PENDING_VERIFICATION)', async () => {
      const email = newEmail();
      const res = await basic(http.post(`${PREFIX}/onboarding`))
        .send(onboardingBody(email))
        .expect(201);
      const data = unwrap(res.body);
      expect(data.email).toBe(email);
      expect(data.status).toBe('PENDING_VERIFICATION');
      expect(data.referenceId).toEqual(expect.any(String));
    });

    // CP-BE-AUTH-008
    it('rechaza email duplicado con 409 (USER_ALREADY_EXISTS)', async () => {
      const email = newEmail();
      await basic(http.post(`${PREFIX}/onboarding`))
        .send(onboardingBody(email))
        .expect(201);
      const res = await basic(http.post(`${PREFIX}/onboarding`))
        .send(onboardingBody(email))
        .expect(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/ya existe/i);
    });

    // CP-BE-AUTH-009
    it('rechaza passwords que no coinciden con 400', async () => {
      const res = await basic(http.post(`${PREFIX}/onboarding`))
        .send(onboardingBody(newEmail(), E2E_PASSWORD, 'Otra-Passw0rd!1'))
        .expect(400);
      expect(res.body.error.message).toMatch(/no coinciden/i);
    });

    // CP-BE-AUTH-010
    it.failing(
      'DEF-BE-001: body inválido debe responder 400/422 (hoy 500)',
      async () => {
        const res = await basic(http.post(`${PREFIX}/onboarding`)).send({
          email: 'nope',
        });
        expect([400, 422]).toContain(res.status);
      },
    );

    // CP-BE-AUTH-011
    it('un usuario recién registrado inicia sesión con estado PENDING_VERIFICATION y sin acceso admin', async () => {
      const email = newEmail();
      await basic(http.post(`${PREFIX}/onboarding`))
        .send(onboardingBody(email))
        .expect(201);
      const s = await login(http, email, E2E_PASSWORD);
      const payload = JSON.parse(
        Buffer.from(s.accessToken.split('.')[1], 'base64url').toString(),
      );
      expect(payload.userStatus).toBe('PENDING_VERIFICATION');
      await http
        .get(`${PREFIX}/admin/ai-disclosures`)
        .set(bearer(s.accessToken))
        .expect(403);
    });
  });

  describe('Login', () => {
    // CP-BE-AUTH-012
    it('password incorrecta -> 401', async () => {
      // Un login exitoso posterior de cliente_b (tests siguientes) resetea el contador de intentos.
      const res = await rawLogin(
        http,
        FIXTURE.clienteB.email,
        'Mala-Passw0rd!',
      );
      expect(res.status).toBe(401);
      expect(unwrap(res.body)?.accessToken).toBeUndefined();
    });

    // CP-BE-AUTH-013
    it.failing(
      'DEF-BE-003: email inexistente debe dar 401 como la password incorrecta (hoy 200 {login:false})',
      async () => {
        const res = await rawLogin(http, newEmail(), 'Cualquiera-1!');
        expect(res.status).toBe(401);
      },
    );

    // CP-BE-AUTH-014
    it.failing(
      'DEF-BE-001: login con body vacío debe dar 400/422 (hoy 500)',
      async () => {
        const res = await basic(http.post(`${PREFIX}/auth/login`)).send({});
        expect([400, 422]).toContain(res.status);
      },
    );

    // CP-BE-AUTH-015
    it('reutilizar un nonce no permite un segundo login', async () => {
      const nonce = await getNonce(http);
      const body = {
        email: FIXTURE.clienteB.email,
        encryptedPassword: rsaEncrypt(
          pem,
          JSON.stringify({ password: E2E_PASSWORD, nonce }),
        ),
      };
      const first = await basic(http.post(`${PREFIX}/auth/login`)).send(body);
      expect([200, 201]).toContain(first.status);
      const second = await basic(http.post(`${PREFIX}/auth/login`)).send(body);
      expect(unwrap(second.body)?.accessToken).toBeUndefined();
      expect(second.status).toBeGreaterThanOrEqual(400);
    });

    // CP-BE-AUTH-016
    it('el login emite cookies httpOnly accessToken y refreshToken', async () => {
      const res = await rawLogin(http, FIXTURE.clienteB.email, E2E_PASSWORD);
      expect([200, 201]).toContain(res.status);
      const cookies = (res.headers['set-cookie'] as unknown as string[]) ?? [];
      for (const name of ['accessToken', 'refreshToken']) {
        const c = cookies.find((x) => x.startsWith(`${name}=`));
        expect(c).toBeDefined();
        expect(c).toMatch(/HttpOnly/i);
      }
    });

    // CP-BE-AUTH-017
    it('el cliente Basic mobile también puede autenticar', async () => {
      const nonceRes = await basic(
        http.post(`${PREFIX}/auth/nonce`),
        MOBILE,
      ).expect(201);
      const { nonce } = unwrap(nonceRes.body);
      const res = await basic(http.post(`${PREFIX}/auth/login`), MOBILE).send({
        email: FIXTURE.clienteB.email,
        encryptedPassword: rsaEncrypt(
          pem,
          JSON.stringify({ password: E2E_PASSWORD, nonce }),
        ),
      });
      expect([200, 201]).toContain(res.status);
      expect(unwrap(res.body).accessToken).toEqual(expect.any(String));
    });
  });

  describe('/auth/scope refleja permisos reales por fixture', () => {
    const scopeOf = async (u: { email: string; password: string }) => {
      const s = await login(http, u.email, u.password);
      const res = await http
        .get(`${PREFIX}/auth/scope`)
        .set(bearer(s.accessToken))
        .expect(200);
      const d = unwrap(res.body);
      return {
        user: d.user,
        roles: d.roles.map((r: any) => r.name) as string[],
        perms: d.permissions.map((p: any) => p.name) as string[],
      };
    };

    // CP-BE-AUTH-018
    it('admin: rol ADMIN y admin:all', async () => {
      const s = await scopeOf(FIXTURE.admin);
      expect(s.user.email).toBe(FIXTURE.admin.email);
      expect(s.roles).toContain('ADMIN');
      expect(s.perms).toContain('admin:all');
    });

    // CP-BE-AUTH-019
    it('cliente_a: sin roles ni permisos administrativos', async () => {
      const s = await scopeOf(FIXTURE.clienteA);
      expect(s.user.email).toBe(FIXTURE.clienteA.email);
      expect(s.perms).not.toContain('admin:all');
      expect(s.roles).not.toContain('ADMIN');
    });

    // CP-BE-AUTH-020
    it('compliance: rol COMPLIANCE con permisos legales y sin admin:all', async () => {
      const s = await scopeOf(FIXTURE.compliance);
      expect(s.roles).toContain('COMPLIANCE');
      expect(s.perms).toEqual(
        expect.arrayContaining([
          'legal.config:manage',
          'legal.consent-audit:read',
        ]),
      );
      expect(s.perms).not.toContain('admin:all');
    });
  });

  describe('Refresh token (cookie + Basic Auth)', () => {
    // CP-BE-AUTH-021
    it('refresh válido devuelve un accessToken utilizable', async () => {
      const s = await login(http, FIXTURE.clienteB.email, E2E_PASSWORD);
      const res = await basic(http.post(`${PREFIX}/auth/refresh-token`))
        .set('Cookie', s.refreshCookie!)
        .expect((r) => expect([200, 201]).toContain(r.status));
      const { accessToken } = unwrap(res.body);
      expect(accessToken).toEqual(expect.any(String));
      await http
        .get(`${PREFIX}/auth/scope`)
        .set(bearer(accessToken))
        .expect(200);
    });

    // CP-BE-AUTH-022
    it('refresh con cookie basura -> 401', async () => {
      await basic(http.post(`${PREFIX}/auth/refresh-token`))
        .set('Cookie', 'refreshToken=no-es-un-jwt')
        .expect(401);
    });

    // CP-BE-AUTH-023
    it('refresh sin cookie -> 401', async () => {
      await basic(http.post(`${PREFIX}/auth/refresh-token`)).expect(401);
    });

    // CP-BE-AUTH-024
    it('refresh expirado (firmado con la clave real) -> 401', async () => {
      const expired = sign(
        { email: FIXTURE.clienteB.email, tokenType: 'refreshToken' },
        process.env.JWT_PRIVATE_KEY as string,
        { algorithm: 'RS256', expiresIn: -60 },
      );
      await basic(http.post(`${PREFIX}/auth/refresh-token`))
        .set('Cookie', `refreshToken=${expired}`)
        .expect(401);
    });

    // CP-BE-AUTH-025
    it('refresh firmado con otra clave -> 401', async () => {
      const { generateKeyPairSync } = require('crypto');
      const other = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
      });
      const forged = sign(
        { email: FIXTURE.clienteB.email, tokenType: 'refreshToken' },
        other.privateKey,
        { algorithm: 'RS256', expiresIn: 600 },
      );
      await basic(http.post(`${PREFIX}/auth/refresh-token`))
        .set('Cookie', `refreshToken=${forged}`)
        .expect(401);
    });

    // CP-BE-AUTH-026
    it.failing(
      'DEF-BE-004: el 401 de refresh debe llamarse "Unauthorized" en error.error (hoy "Internal Server Error")',
      async () => {
        const res = await basic(
          http.post(`${PREFIX}/auth/refresh-token`),
        ).expect(401);
        expect(res.body.error.error).toBe('Unauthorized');
      },
    );

    // CP-BE-AUTH-027
    it.failing(
      'DEF-BE-006: existe logout que invalide la sesión (hoy POST /auth/logout -> 404)',
      async () => {
        const s = await login(http, FIXTURE.clienteB.email, E2E_PASSWORD);
        const res = await http
          .post(`${PREFIX}/auth/logout`)
          .set(bearer(s.accessToken));
        expect([200, 201, 204]).toContain(res.status);
      },
    );
  });

  describe('Basic Auth inválido o ausente en endpoints pre-login', () => {
    const endpoints: Array<[string, 'get' | 'post' | 'put', string]> = [
      ['public-key', 'get', '/auth/public-key'],
      ['nonce', 'post', '/auth/nonce'],
      ['login', 'post', '/auth/login'],
      ['onboarding', 'post', '/onboarding'],
      ['refresh-token', 'post', '/auth/refresh-token'],
      ['forgot-password', 'put', '/auth/forgot-password'],
      ['create-password', 'post', '/auth/create-password'],
      ['change-expired-password', 'put', '/auth/change-expired-password'],
    ];

    // CP-BE-AUTH-028
    it.each(endpoints)('%s sin Authorization -> 401', async (_n, m, path) => {
      await (http as any)[m](`${PREFIX}${path}`).send({}).expect(401);
    });

    // CP-BE-AUTH-029
    it.each(endpoints)(
      '%s con secret incorrecto -> 401',
      async (_n, m, path) => {
        await (http as any)
          [m](`${PREFIX}${path}`)
          .auth(WEB.user, 'secreto-incorrecto')
          .send({})
          .expect(401);
      },
    );

    // CP-BE-AUTH-030
    it.each(endpoints)(
      '%s con clientId inexistente -> 401',
      async (_n, m, path) => {
        await (http as any)
          [m](`${PREFIX}${path}`)
          .auth('cliente-fantasma', WEB.pass)
          .send({})
          .expect(401);
      },
    );

    // CP-BE-AUTH-031
    it('Authorization con formato Bearer en un endpoint Basic -> 401', async () => {
      const s = await login(http, FIXTURE.clienteB.email, E2E_PASSWORD);
      await http
        .post(`${PREFIX}/auth/nonce`)
        .set(bearer(s.accessToken))
        .expect(401);
    });
  });

  describe('Guards de autorización', () => {
    // CP-BE-AUTH-032
    it.each([
      ['GET', '/admin/ai-disclosures'],
      ['GET', '/admin/audit-logs'],
      ['GET', '/users'],
      ['GET', '/admin/legal/document-versions'],
      ['POST', '/professionals/1/verify'],
      ['POST', '/professionals/1/suspend'],
    ])('cliente_a: %s %s -> 403', async (m, path) => {
      const s = await login(http, FIXTURE.clienteA.email, E2E_PASSWORD);
      const req = (http as any)
        [m.toLowerCase()](`${PREFIX}${path}`)
        .set(bearer(s.accessToken));
      const res = await (m === 'POST' ? req.send({ reason: 'x' }) : req);
      expect(res.status).toBe(403);
    });

    // CP-BE-AUTH-033
    it.each([
      ['pro_aprobado', FIXTURE.proAprobado],
      ['compliance', FIXTURE.compliance],
    ])(
      '%s sin permiso no puede verify/suspend de professionals (403)',
      async (_n, u) => {
        const s = await login(http, u.email, u.password);
        for (const action of ['verify', 'suspend']) {
          await http
            .post(`${PREFIX}/professionals/1/${action}`)
            .set(bearer(s.accessToken))
            .send({ reason: 'x' })
            .expect(403);
        }
      },
    );

    // CP-BE-AUTH-034
    it('token ausente, malformado o de otra clave -> 401 en endpoint protegido', async () => {
      await http.get(`${PREFIX}/auth/scope`).expect(401);
      await http
        .get(`${PREFIX}/auth/scope`)
        .set(bearer('eyJhbGciOiJSUzI1NiJ9.e30.x'))
        .expect(401);
      const forged = sign({ email: FIXTURE.admin.email }, 'otra-clave-hs', {
        expiresIn: 600,
      });
      await http.get(`${PREFIX}/auth/scope`).set(bearer(forged)).expect(401);
    });
  });

  describe('Rol COMPLIANCE', () => {
    // CP-BE-AUTH-036
    it.each([
      '/admin/legal/consents',
      '/admin/legal/content-consents',
      '/admin/legal/document-versions',
      '/admin/legal/retention-policies',
    ])('compliance accede a GET %s (200)', async (path) => {
      const s = await login(http, FIXTURE.compliance.email, E2E_PASSWORD);
      await http.get(`${PREFIX}${path}`).set(bearer(s.accessToken)).expect(200);
    });

    // CP-BE-AUTH-037
    it.each(['/users', '/admin/audit-logs', '/admin/ai-disclosures'])(
      'compliance recibe 403 en endpoint admin ajeno GET %s',
      async (path) => {
        const s = await login(http, FIXTURE.compliance.email, E2E_PASSWORD);
        await http
          .get(`${PREFIX}${path}`)
          .set(bearer(s.accessToken))
          .expect(403);
      },
    );

    // CP-BE-AUTH-038
    it('cliente_a no accede a la auditoría de consentimientos (403)', async () => {
      const s = await login(http, FIXTURE.clienteA.email, E2E_PASSWORD);
      await http
        .get(`${PREFIX}/admin/legal/consents`)
        .set(bearer(s.accessToken))
        .expect(403);
    });
  });
});
