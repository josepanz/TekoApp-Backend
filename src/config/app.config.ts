import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from './database.config';
import { SecurityConfig } from './security.config';
import { ValidationConfig } from './validation.config';
import { CacheConfig } from './cache.config';
import { RateLimitConfig } from './rate-limit.config';
import { LoggerConfig } from './logger.config';

export class AppConfig {
  constructor(private configService: ConfigService) {}

  // Configuración de la aplicación
  get app() {
    return {
      name: this.configService.get('APP_NAME', 'TekoApp'),
      version: this.configService.get('APP_VERSION', '1.0.0'),
      environment: this.configService.get('NODE_ENV', 'development'),
      port: this.configService.get('PORT', 3000),
      url: this.configService.get('APP_URL', 'http://localhost:3000'),
      frontendUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3001'),
      allowedOrigins: this.configService.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001')
        .split(',')
        .map(origin => origin.trim()),
    };
  }

  // Configuración de base de datos
  get database() {
    return {
      postgres: DatabaseConfig.getTypeOrmConfig(this.configService),
      mongodb: DatabaseConfig.getMongooseConfig(this.configService),
      redis: DatabaseConfig.getBullConfig(this.configService),
    };
  }

  // Configuración de seguridad
  get security() {
    return {
      helmet: SecurityConfig.getHelmetOptions(this.configService),
      cors: SecurityConfig.getCorsOptions(this.configService),
      rateLimit: SecurityConfig.getRateLimitOptions(this.configService),
      compression: SecurityConfig.getCompressionOptions(),
      trustProxy: SecurityConfig.getTrustProxyOptions(),
      headers: SecurityConfig.getSecurityHeaders(),
      inputValidation: SecurityConfig.getInputValidationOptions(),
      logging: SecurityConfig.getSecurityLoggingOptions(),
    };
  }

  // Configuración de validación
  get validation() {
    return {
      options: ValidationConfig.getValidationOptions(),
      rules: ValidationConfig.getValidationRules(),
      messages: ValidationConfig.getCustomMessages(),
    };
  }

  // Configuración de cache
  get cache() {
    return {
      module: CacheConfig.createCacheModule(this.configService),
      ttl: CacheConfig.getTTL,
      keys: CacheConfig.getCacheKey,
      listKeys: CacheConfig.getListCacheKey,
      searchKeys: CacheConfig.getSearchCacheKey,
      locationKeys: CacheConfig.getLocationCacheKey,
      statsKeys: CacheConfig.getStatsCacheKey,
    };
  }

  // Configuración de rate limiting
  get rateLimit() {
    return RateLimitConfig.createLimiter(this.configService);
  }

  // Configuración de logging
  get logger() {
    return LoggerConfig.createLogger();
  }

  // Configuración de JWT
  get jwt() {
    return {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
      refreshExpiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    };
  }

  // Configuración de Google Maps
  get googleMaps() {
    return {
      apiKey: this.configService.get('GOOGLE_MAPS_API_KEY'),
      defaultRadius: this.configService.get('DEFAULT_RADIUS_KM', 10),
      maxRadius: this.configService.get('MAX_RADIUS_KM', 50),
    };
  }

  // Configuración de Firebase
  get firebase() {
    return {
      projectId: this.configService.get('FIREBASE_PROJECT_ID'),
      privateKey: this.configService.get('FIREBASE_PRIVATE_KEY'),
      clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
    };
  }

  // Configuración de Stripe
  get stripe() {
    return {
      secretKey: this.configService.get('STRIPE_SECRET_KEY'),
      webhookSecret: this.configService.get('STRIPE_WEBHOOK_SECRET'),
      currency: this.configService.get('PAYMENT_CURRENCY', 'PYG'),
      minAmount: this.configService.get('PAYMENT_MIN_AMOUNT', 10000),
      maxAmount: this.configService.get('PAYMENT_MAX_AMOUNT', 1000000),
    };
  }

  // Configuración de AWS S3
  get aws() {
    return {
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      bucket: this.configService.get('AWS_S3_BUCKET', 'tekoapp-uploads'),
    };
  }

  // Configuración de email
  get email() {
    return {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT', 587),
      user: this.configService.get('SMTP_USER'),
      pass: this.configService.get('SMTP_PASS'),
    };
  }

  // Configuración de SMS (Twilio)
  get sms() {
    return {
      accountSid: this.configService.get('TWILIO_ACCOUNT_SID'),
      authToken: this.configService.get('TWILIO_AUTH_TOKEN'),
      phoneNumber: this.configService.get('TWILIO_PHONE_NUMBER'),
    };
  }

  // Configuración de notificaciones
  get notifications() {
    return {
      push: this.configService.get('PUSH_NOTIFICATIONS_ENABLED', true),
      sms: this.configService.get('SMS_NOTIFICATIONS_ENABLED', true),
      email: this.configService.get('EMAIL_NOTIFICATIONS_ENABLED', true),
    };
  }

  // Configuración de paginación
  get pagination() {
    return {
      defaultPage: 1,
      defaultLimit: 20,
      maxLimit: 100,
    };
  }

  // Configuración de archivos
  get files() {
    return {
      maxSize: this.configService.get('MAX_FILE_SIZE', '5mb'),
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      uploadPath: this.configService.get('UPLOAD_PATH', './uploads'),
    };
  }

  // Configuración de testing
  get testing() {
    return {
      database: DatabaseConfig.getTestConfig(),
      timeout: 30000,
      retries: 3,
    };
  }

  // Verificar si la configuración es válida
  validate(): boolean {
    const requiredKeys = [
      'JWT_SECRET',
      'POSTGRES_HOST',
      'POSTGRES_USER',
      'POSTGRES_PASSWORD',
      'POSTGRES_DB',
      'MONGODB_URI',
      'REDIS_HOST',
    ];

    const missingKeys = requiredKeys.filter(key => !this.configService.get(key));

    if (missingKeys.length > 0) {
      throw new Error(`Configuración incompleta. Faltan las siguientes variables: ${missingKeys.join(', ')}`);
    }

    return true;
  }

  // Obtener configuración completa
  getAll() {
    return {
      app: this.app,
      database: this.database,
      security: this.security,
      validation: this.validation,
      cache: this.cache,
      rateLimit: this.rateLimit,
      logger: this.logger,
      jwt: this.jwt,
      googleMaps: this.googleMaps,
      firebase: this.firebase,
      stripe: this.stripe,
      aws: this.aws,
      email: this.email,
      sms: this.sms,
      notifications: this.notifications,
      pagination: this.pagination,
      files: this.files,
      testing: this.testing,
    };
  }
}
