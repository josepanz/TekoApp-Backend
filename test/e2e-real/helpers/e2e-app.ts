/* eslint-disable */
/**
 * Helper compartido de los specs e2e-real (smoke, auth, catálogos): arranca AppModule +
 * MiddlewareConfig in-process contra el stack docker-compose.e2e.yml y expone login RSA + nonce.
 * Extraído de smoke.e2e-real-spec.ts (no duplicar: los specs nuevos lo importan de acá).
 */
import { Test } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { constants, publicEncrypt, randomBytes } from 'crypto';
import request = require('supertest');
import cookieParser from 'cookie-parser';
import { AppModule } from '../../../src/app.module';
import { MiddlewareConfig } from '../../../src/core/config/middleware.config';
import { RateLimitConfig } from '../../../src/core/config/rate-limit.config';
import { assertSafeEnv } from '../../../scripts/e2e/env';

export const PREFIX = '/tekoapp-backend/api/v1';
export const WEB = {
  user: 'tekoapp-web',
  pass: process.env.WEB_CLIENT_SECRET ?? '',
};
export const MOBILE = {
  user: 'tekoapp-mobile',
  pass: process.env.MOBILE_CLIENT_SECRET ?? '',
};
export const E2E_PASSWORD = 'E2e-Passw0rd!';
export const FIXTURE = {
  admin: { email: 'admin@tekoapp.com.py', password: 'Tekoapp123!' },
  clienteA: { email: 'cliente_a@e2e.tekoapp.local', password: E2E_PASSWORD },
  clienteB: { email: 'cliente_b@e2e.tekoapp.local', password: E2E_PASSWORD },
  proAprobado: {
    email: 'pro_aprobado@e2e.tekoapp.local',
    password: E2E_PASSWORD,
  },
  proPendiente: {
    email: 'pro_pendiente@e2e.tekoapp.local',
    password: E2E_PASSWORD,
  },
  compliance: { email: 'compliance@e2e.tekoapp.local', password: E2E_PASSWORD },
} as const;

export type Http = ReturnType<typeof request>;
export interface E2eApp {
  app: INestApplication;
  http: Http;
  close: () => Promise<void>;
}

export const unwrap = (body: any) =>
  body && body.data !== undefined ? body.data : body;

export async function bootApp(): Promise<E2eApp> {
  // Defensa en profundidad: si alguien corre jest directo sin el CLI, igual no debe tocar Supabase.
  assertSafeEnv(process.env);
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('/tekoapp-backend/api');
  MiddlewareConfig.setup(app, app.get(ConfigService));
  await app.init();
  return {
    app,
    http: request(app.getHttpServer()) as any,
    close: async () => {
      await app.close();
      await RateLimitConfig.closeRedisClient();
    },
  };
}

export const basic = (r: request.Test, creds = WEB) =>
  r.auth(creds.user, creds.pass);

export async function getPublicKey(http: Http): Promise<string> {
  const res = await basic(http.get(`${PREFIX}/auth/public-key`)).expect(200);
  return unwrap(res.body).publicKeyPem;
}

export async function getNonce(http: Http): Promise<string> {
  const res = await basic(http.post(`${PREFIX}/auth/nonce`)).expect(201);
  return unwrap(res.body).nonce;
}

export function rsaEncrypt(publicKeyPem: string, plain: string): string {
  return publicEncrypt(
    {
      key: publicKeyPem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(plain),
  ).toString('base64');
}

/** Login completo (clave pública + nonce + RSA); devuelve la respuesta cruda sin afirmar el status. */
export async function rawLogin(
  http: Http,
  email: string,
  password: string,
  extra: Record<string, unknown> = {},
): Promise<request.Response> {
  const pem = await getPublicKey(http);
  const nonce = await getNonce(http);
  const encryptedPassword = rsaEncrypt(
    pem,
    JSON.stringify({ password, nonce }),
  );
  return basic(http.post(`${PREFIX}/auth/login`)).send({
    email,
    encryptedPassword,
    ...extra,
  });
}

export interface Session {
  accessToken: string;
  cookies: string[];
  refreshCookie?: string;
}

export async function login(
  http: Http,
  email: string,
  password: string,
  extra: Record<string, unknown> = {},
): Promise<Session> {
  const res = await rawLogin(http, email, password, extra);
  expect([200, 201]).toContain(res.status);
  const { accessToken } = unwrap(res.body);
  expect(typeof accessToken).toBe('string');
  const cookies = (
    (res.headers['set-cookie'] as unknown as string[]) ?? []
  ).map((c) => c.split(';')[0]);
  return {
    accessToken,
    cookies,
    refreshCookie: cookies.find((c) => c.startsWith('refreshToken=')),
  };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export const uniqueSuffix = () => randomBytes(4).toString('hex');
