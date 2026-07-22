// src/config/config-schema.ts
import * as Joi from 'joi';

export const configSchema = Joi.object({
  PROJECT_NAME: Joi.string().required(),
  PROJECT_DESCRIPTION: Joi.string().required(),
  BASE_URL: Joi.string().uri().required(),
  PORT: Joi.number().required(),
  NODE_ENV: Joi.string()
    .required()
    .valid('local', 'develop', 'qa', 'production'),
  ALLOWED_ORIGINS: Joi.string().required(),

  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  ACCESS_TOKEN_EXPIRES: Joi.string().required(),
  TEMP_TOKEN_EXPIRES: Joi.string().required(),
  REFRESH_TOKEN_EXPIRES: Joi.string().required(),
  REFRESH_TOKEN_SHORT_EXPIRES: Joi.string().required(),

  SEQ_ENABLED: Joi.boolean().default(false),
  SEQ_URL: Joi.string().uri().required(),

  DATABASE_URL: Joi.string().required(),
  DATABASE_CONNECTION_STRING: Joi.string().required(),
  AUDIT_SECRET_PEPPER: Joi.string().required(),

  MONGODB_URI: Joi.string().required(),
  MONGODB_MAX_POOL_SIZE: Joi.number().integer().default(10),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().integer().required(),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().default(0),

  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().required(),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  EMAIL_DIR: Joi.string().required(), // Eliminado el validador estricto .email() si representa el remitente general o una ruta de directorio interna de plantillas.

  S3_ACCESS_KEY_ID: Joi.string().required(),
  S3_SECRET_ACCESS_KEY: Joi.string().required(),
  S3_BUCKET_NAME: Joi.string().required(),
  S3_REGION: Joi.string().required(),
  S3_MAX_CONCURRENCY: Joi.number().integer().default(5),
  S3_RETRY_ATTEMPTS: Joi.number().integer().default(0),
  S3_RETRY_DELAY_MS: Joi.number().integer().default(250),
  S3_PRESIGNED_URL_EXPIRES_IN: Joi.number().integer().default(900),

  GOOGLE_MAPS_API_KEY: Joi.string().required(),
  DEFAULT_RADIUS_KM: Joi.number().integer().default(10),
  MAX_RADIUS_KM: Joi.number().integer().default(50),

  FIREBASE_PROJECT_ID: Joi.string().required(),
  FIREBASE_PRIVATE_KEY: Joi.string().required(),
  FIREBASE_CLIENT_EMAIL: Joi.string().required(),

  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  PAYMENT_CURRENCY: Joi.string().default('PYG'),
  PAYMENT_MIN_AMOUNT: Joi.number().integer().default(10000),
  PAYMENT_MAX_AMOUNT: Joi.number().integer().default(1000000),

  TWILIO_ACCOUNT_SID: Joi.string().required(),
  TWILIO_AUTH_TOKEN: Joi.string().required(),
  TWILIO_PHONE_NUMBER: Joi.string().required(),
});
