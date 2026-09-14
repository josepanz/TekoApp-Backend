// src/config/config-loader.ts
import { registerAs } from '@nestjs/config';
import * as path from 'path';
import { AiDisclosureEntityType } from '@prisma/client';

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
    // H-01: GlitchTip (implementa el protocolo de Sentry). `glitchtipDsn` queda `undefined` si la
    // env var no está seteada o viene vacía — ese es el estado normal hoy, sin cuenta creada
    // todavía. `SentryReporterService` no inicializa el SDK sin este valor.
    observability: {
      glitchtipDsn: process.env.GLITCHTIP_DSN || undefined,
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
      // 0 (o sin setear) = expiración indefinida.
      passwordExpirationDays: process.env.PASSWORD_EXPIRATION_DAYS
        ? parseInt(process.env.PASSWORD_EXPIRATION_DAYS)
        : 0,
      passwordHistoryLimit: process.env.PASSWORD_HISTORY_LIMIT
        ? parseInt(process.env.PASSWORD_HISTORY_LIMIT)
        : 5,
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
      // Solo para proveedores S3-compatibles que no son AWS real (MinIO local, Cloudflare R2,
      // etc.) — sin setear, el SDK resuelve el endpoint real de AWS por `region` como siempre.
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
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
    webPush: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? '',
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? '',
      vapidSubject: process.env.VAPID_SUBJECT ?? '',
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
    // Qué tipos de contenido admiten auto-declaración de IA por parte del usuario dueño — agregar
    // un tipo nuevo acá es config, no código (ver openspec/specs/ai-content-disclosure.md). Lista
    // fija (no viene de env var): son valores de negocio, no secretos de infraestructura.
    aiDisclosure: {
      userDeclarableTypes: [
        AiDisclosureEntityType.SERVICE_DESCRIPTION,
        AiDisclosureEntityType.PROFESSIONAL_DESCRIPTION,
      ] as AiDisclosureEntityType[],
    },
    progressLog: {
      maxImagesPerEntry: process.env.PROGRESS_LOG_MAX_IMAGES_PER_ENTRY
        ? parseInt(process.env.PROGRESS_LOG_MAX_IMAGES_PER_ENTRY)
        : 6,
      editWindowMinutes: process.env.PROGRESS_LOG_EDIT_WINDOW_MINUTES
        ? parseInt(process.env.PROGRESS_LOG_EDIT_WINDOW_MINUTES)
        : 15,
      requireNoteOrImage:
        process.env.PROGRESS_LOG_REQUIRE_NOTE_OR_IMAGE !== 'false',
    },
    accountDeletion: {
      // Ventana de gracia (I-01): días entre pedir el borrado y la anonimización efectiva.
      // Propuesta sin medir, no un número legal obligatorio — ver
      // openspec/changes/platform-hardening-2026-09/I-01-account-deletion.md.
      gracePeriodDays: process.env.ACCOUNT_DELETION_GRACE_PERIOD_DAYS
        ? parseInt(process.env.ACCOUNT_DELETION_GRACE_PERIOD_DAYS)
        : 14,
    },
    notifications: {
      // Tarea 5 (I-05, platform-hardening-2026-09): reintentos del job `send-notification` de
      // la cola `notifications` — decisión de José, "hasta N, 3 por defecto, configurable".
      // Se pasa como `attempts` al encolar (`NotificationsService.create`/`createBulk`), no en
      // `defaultJobOptions` de `BullModule.registerQueue`, porque ese registro es síncrono y
      // este valor viene de `APP_CONFIG` (inyectado, no `process.env` directo fuera de acá).
      maxRetryAttempts: process.env.NOTIFICATIONS_MAX_RETRY_ATTEMPTS
        ? parseInt(process.env.NOTIFICATIONS_MAX_RETRY_ATTEMPTS)
        : 3,
    },
  };
});

export type AppConfigType = typeof APP_CONFIG;
