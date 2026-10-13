/**
 * Carga del entorno E2E. NUNCA lee `.env` (apunta a Supabase compartido con datos reales).
 * - Lee SOLO `.env.e2e` (si falta, lo crea desde `.env.e2e.example`, que no tiene secretos).
 * - Sobrescribe `process.env` con esos valores (nada heredado de la shell/`.env` sobrevive en las
 *   claves que define) y ABORTA si alguna conexión parece Supabase/pooler o no es localhost.
 * - Genera un par RSA nuevo en cada proceso (no se commitea ni se guarda en disco).
 */
import { existsSync, copyFileSync, readFileSync } from 'fs';
import { generateKeyPairSync } from 'crypto';
import { resolve } from 'path';
import * as webpush from 'web-push';

const ROOT = resolve(__dirname, '..', '..');
const ENV_FILE = resolve(ROOT, '.env.e2e');
const ENV_EXAMPLE = resolve(ROOT, '.env.e2e.example');
const BASE_EXAMPLE = resolve(ROOT, '.env.example');

export function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function assertSafeEnv(env: Record<string, string | undefined>): void {
  const forbidden = /supabase|pooler/i;
  const connectionKeys = [
    'DATABASE_URL',
    'DATABASE_CONNECTION_STRING',
    'MONGODB_URI',
    'REDIS_HOST',
    'S3_ENDPOINT',
    'EMAIL_HOST',
  ];
  for (const key of connectionKeys) {
    const value = env[key] ?? '';
    if (forbidden.test(value)) {
      throw new Error(
        `[e2e] ABORTADO: ${key} contiene "supabase"/"pooler". El E2E solo corre contra el stack Docker local.`,
      );
    }
    if (!value) continue;
    let host = value;
    if (value.includes('://')) {
      try {
        host = new URL(value).hostname;
      } catch {
        host = '';
      }
    }
    if (host && !['localhost', '127.0.0.1'].includes(host)) {
      throw new Error(
        `[e2e] ABORTADO: ${key} apunta a "${host}" (solo localhost/127.0.0.1 permitido).`,
      );
    }
  }
  if (!env['DATABASE_URL']) {
    throw new Error('[e2e] ABORTADO: DATABASE_URL vacío.');
  }
  if (/:5432\b/.test(env['DATABASE_URL'])) {
    throw new Error(
      '[e2e] ABORTADO: DATABASE_URL usa el puerto 5432 (Postgres nativo de Windows). El stack E2E usa 55432.',
    );
  }
}

export function loadE2eEnv(): void {
  if (!existsSync(ENV_FILE)) {
    copyFileSync(ENV_EXAMPLE, ENV_FILE);
    console.log('[e2e] .env.e2e creado desde .env.e2e.example');
  }
  const fileEnv = parseEnv(readFileSync(ENV_FILE, 'utf8'));

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const vapid = webpush.generateVAPIDKeys();
  const merged: Record<string, string> = {
    ...fileEnv,
    JWT_PRIVATE_KEY: fileEnv.JWT_PRIVATE_KEY || privateKey,
    JWT_PUBLIC_KEY: fileEnv.JWT_PUBLIC_KEY || publicKey,
    VAPID_PUBLIC_KEY: fileEnv.VAPID_PUBLIC_KEY || vapid.publicKey,
    VAPID_PRIVATE_KEY: fileEnv.VAPID_PRIVATE_KEY || vapid.privateKey,
  };

  assertSafeEnv(merged);

  // Todo lo que exige `.env.example` (y por ende Joi) debe venir de `.env.e2e`: si faltara una
  // clave, `ConfigModule` la leería de `.env` (Supabase) por su `envFilePath`.
  const required = Object.keys(parseEnv(readFileSync(BASE_EXAMPLE, 'utf8')));
  const missing = required.filter((k) => !(k in merged));
  if (missing.length > 0) {
    throw new Error(
      `[e2e] ABORTADO: .env.e2e no define ${missing.join(', ')} (se leerían de .env, que apunta a Supabase).`,
    );
  }

  Object.assign(process.env, merged);
}
