// src/config/config-loader.ts
import { registerAs } from '@nestjs/config';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require(path.join(process.cwd(), 'package.json')) as {
  name?: string;
  description?: string;
  version?: string;
};

export const APP_CONFIG = registerAs('config', () => {
  return {
    env: process.env.NODE_ENV,
    baseUrl: process.env.BASE_URL,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
    apiconfig: {
      port: Number(process.env.PORT),
    },
    logger: {
      seqUrl: process.env.SEQ_URL,
      seqEnabled: process.env.SEQ_ENABLED === 'true',
    },
    project: {
      name: process.env.PROJECT_NAME ?? pkg?.name,
      description: process.env.PROJECT_DESCRIPTION ?? pkg?.description,
      version: pkg?.version ?? '1',
    },
    authentication: {
      privateKey: process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
      publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') ?? '',
      accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES ?? '15m',
      tempTokenExpires: process.env.TEMP_TOKEN_EXPIRES ?? '1h',
      refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES ?? '7d',
      shortRefreshTokenExpires:
        process.env.REFRESH_TOKEN_SHORT_EXPIRES ?? '12h',
    },
    email: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 25,
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      dir: process.env.EMAIL_DIR,
    },
    database: {
      connectionString: process.env.DATABASE_CONNECTION_STRING,
      url: process.env.DATABASE_URL,
      auditSecretPepper: process.env.AUDIT_SECRET_PEPPER,
      // Configuración unificada para MongoDB
      mongodbUri: process.env.MONGODB_URI,
      mongodbMaxPoolSize: process.env.MONGODB_MAX_POOL_SIZE
        ? parseInt(process.env.MONGODB_MAX_POOL_SIZE)
        : 10,
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
    },
    s3: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.S3_REGION,
      maxConcurrency: process.env.S3_MAX_CONCURRENCY
        ? parseInt(process.env.S3_MAX_CONCURRENCY)
        : 5,
      retryAttempts: process.env.S3_RETRY_ATTEMPTS
        ? parseInt(process.env.S3_RETRY_ATTEMPTS)
        : 0,
      retryDelayMs: process.env.S3_RETRY_DELAY_MS
        ? parseInt(process.env.S3_RETRY_DELAY_MS)
        : 250,
      presignedUrlExpiresInSeconds: process.env.S3_PRESIGNED_URL_EXPIRES_IN
        ? parseInt(process.env.S3_PRESIGNED_URL_EXPIRES_IN)
        : 900,
    },
    geolocation: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      defaultRadiusKm: process.env.DEFAULT_RADIUS_KM
        ? parseInt(process.env.DEFAULT_RADIUS_KM)
        : 10,
      maxRadiusKm: process.env.MAX_RADIUS_KM
        ? parseInt(process.env.MAX_RADIUS_KM)
        : 50,
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      currency: process.env.PAYMENT_CURRENCY ?? 'PYG',
      minAmount: process.env.PAYMENT_MIN_AMOUNT
        ? parseInt(process.env.PAYMENT_MIN_AMOUNT)
        : 10000,
      maxAmount: process.env.PAYMENT_MAX_AMOUNT
        ? parseInt(process.env.PAYMENT_MAX_AMOUNT)
        : 1000000,
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
  };
});

export type AppConfigType = typeof APP_CONFIG;
