/* eslint-disable */
/**
 * Smoke E2E REAL: levanta la app completa (AppModule + MiddlewareConfig, igual que main.ts) en el
 * proceso de Jest, contra el stack Docker local de `docker-compose.e2e.yml` (Postgres, Mongo,
 * Redis, MinIO, MailHog). Sin mocks. Se lanza con `pnpm test:e2e:real` (que carga `.env.e2e`).
 */
import { Test } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { constants, publicEncrypt } from 'crypto';
import request = require('supertest');
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { MiddlewareConfig } from '../../src/core/config/middleware.config';
import { RateLimitConfig } from '../../src/core/config/rate-limit.config';
import { ConfigService } from '@nestjs/config';
import { assertSafeEnv } from '../../scripts/e2e/env';

const PREFIX = '/tekoapp-backend/api/v1';
const WEB = { user: 'tekoapp-web', pass: process.env.WEB_CLIENT_SECRET ?? '' };
const ADMIN = { email: 'admin@tekoapp.com.py', password: 'Tekoapp123!' };
const CLIENTE_A = {
  email: 'cliente_a@e2e.tekoapp.local',
  password: 'E2e-Passw0rd!',
};

const unwrap = (body: any) =>
  body && body.data !== undefined ? body.data : body;

describe('Smoke E2E real', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    // Defensa en profundidad: si alguien corre jest directo sin el CLI, igual no debe tocar Supabase.
    assertSafeEnv(process.env);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.setGlobalPrefix('/tekoapp-backend/api');
    MiddlewareConfig.setup(app, app.get(ConfigService));
    await app.init();
    http = request(app.getHttpServer()) as any;
  });

  afterAll(async () => {
    await app?.close();
    await RateLimitConfig.closeRedisClient();
  });

  const basic = (r: request.Test) => r.auth(WEB.user, WEB.pass);

  async function login(email: string, password: string): Promise<string> {
    const keyRes = await basic(http.get(`${PREFIX}/auth/public-key`)).expect(
      200,
    );
    const { publicKeyPem } = unwrap(keyRes.body);
    const nonceRes = await basic(http.post(`${PREFIX}/auth/nonce`)).expect(201);
    const { nonce } = unwrap(nonceRes.body);
    const encryptedPassword = publicEncrypt(
      {
        key: publicKeyPem,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(JSON.stringify({ password, nonce })),
    ).toString('base64');
    const res = await basic(http.post(`${PREFIX}/auth/login`))
      .send({ email, encryptedPassword })
      .expect((r) => expect([200, 201]).toContain(r.status));
    const { accessToken } = unwrap(res.body);
    expect(typeof accessToken).toBe('string');
    return accessToken;
  }

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
    const res = await basic(http.get(`${PREFIX}/auth/public-key`)).expect(200);
    expect(unwrap(res.body).publicKeyPem).toContain('BEGIN PUBLIC KEY');
  });

  it('Basic Auth invalido -> 401', async () => {
    await http
      .get(`${PREFIX}/auth/public-key`)
      .auth('tekoapp-web', 'nope')
      .expect(401);
    await http.get(`${PREFIX}/auth/public-key`).expect(401);
  });

  it('nonce + RSA -> login admin -> /auth/scope', async () => {
    const token = await login(ADMIN.email, ADMIN.password);
    const res = await http
      .get(`${PREFIX}/auth/scope`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(JSON.stringify(unwrap(res.body))).toContain('admin:all');
  });

  it('endpoint protegido sin token -> 401', async () => {
    await http.get(`${PREFIX}/auth/scope`).expect(401);
  });

  it('usuario sin permiso -> 403 en endpoint de staff', async () => {
    const token = await login(CLIENTE_A.email, CLIENTE_A.password);
    await http
      .get(`${PREFIX}/admin/ai-disclosures`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
