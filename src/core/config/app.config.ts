import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getMongooseConfig } from '../database/base/mongo/database.config';
import { getBullConfig } from './redis.config';
import * as security from './security.config';
import { ValidationConfig, ValidationRuleItem } from './validation.config';
import { getCacheModuleConfig } from './cache.config';
import { ValidationPipeOptions } from '@nestjs/common';

@Injectable()
export class AppConfig {
  constructor(private readonly configService: ConfigService) {}

  get app() {
    return {
      name: this.configService.get<string>('config.app.name', 'TekoApp'),
      version: this.configService.get<string>('config.app.version', '1.0.0'),
      environment: this.configService.get<string>('config.env', 'development'),
      port: this.configService.get<number>('config.app.port', 3000),
      url: this.configService.get<string>(
        'config.app.url',
        'http://localhost:3000',
      ),
      frontendUrl: this.configService.get<string>(
        'config.app.frontendUrl',
        'http://localhost:3001',
      ),
      allowedOrigins: this.configService.get<string[]>(
        'config.app.allowedOrigins',
        [],
      ),
    };
  }

  get database() {
    return {
      mongodb: getMongooseConfig(this.configService),
      redis: getBullConfig(this.configService),
    };
  }

  get security() {
    return {
      helmet: security.getHelmetOptions(this.configService),
      cors: security.getCorsOptions(this.configService),
      rateLimit: security.getRateLimitOptions(this.configService),
      compression: security.getCompressionOptions(),
      trustProxy: security.getTrustProxyOptions(),
      headers: security.getSecurityHeaders(),
      inputValidation: security.getInputValidationOptions(),
      logging: security.getSecurityLoggingOptions(),
    };
  }

  get validation(): {
    options: ValidationPipeOptions;
    rules: Record<string, ValidationRuleItem>;
    messages: Record<string, string>;
  } {
    return {
      options: ValidationConfig.getValidationOptions(),
      rules: ValidationConfig.getValidationRules(),
      messages: ValidationConfig.getCustomMessages(),
    };
  }

  get cache() {
    return {
      module: getCacheModuleConfig(this.configService),
    };
  }

  get jwt() {
    return {
      secret: this.configService.get<string>('config.jwt.secret'),
      expiresIn: this.configService.get<string>('config.jwt.expiresIn', '7d'),
      refreshExpiresIn: this.configService.get<string>(
        'config.jwt.refreshExpiresIn',
        '30d',
      ),
    };
  }

  get googleMaps() {
    return {
      apiKey: this.configService.get<string>('config.google.mapsApiKey'),
      defaultRadius: this.configService.get<number>(
        'config.google.defaultRadiusKm',
        10,
      ),
      maxRadius: this.configService.get<number>(
        'config.google.maxRadiusKm',
        50,
      ),
    };
  }

  get firebase() {
    return {
      projectId: this.configService.get<string>('config.firebase.projectId'),
      privateKey: this.configService.get<string>('config.firebase.privateKey'),
      clientEmail: this.configService.get<string>(
        'config.firebase.clientEmail',
      ),
    };
  }

  get stripe() {
    return {
      secretKey: this.configService.get<string>('config.stripe.secretKey'),
      webhookSecret: this.configService.get<string>(
        'config.stripe.webhookSecret',
      ),
      currency: this.configService.get<string>('config.stripe.currency', 'PYG'),
      minAmount: this.configService.get<number>(
        'config.stripe.minAmount',
        10000,
      ),
      maxAmount: this.configService.get<number>(
        'config.stripe.maxAmount',
        1000000,
      ),
    };
  }

  get aws() {
    return {
      accessKeyId: this.configService.get<string>('config.aws.accessKeyId'),
      secretAccessKey: this.configService.get<string>(
        'config.aws.secretAccessKey',
      ),
      region: this.configService.get<string>('config.aws.region', 'us-east-1'),
      bucket: this.configService.get<string>(
        'config.aws.bucket',
        'tekoapp-uploads',
      ),
    };
  }

  get email() {
    return {
      host: this.configService.get<string>('config.email.host'),
      port: this.configService.get<number>('config.email.port', 587),
      user: this.configService.get<string>('config.email.user'),
      pass: this.configService.get<string>('config.email.pass'),
    };
  }

  get sms() {
    return {
      accountSid: this.configService.get<string>('config.sms.accountSid'),
      authToken: this.configService.get<string>('config.sms.authToken'),
      phoneNumber: this.configService.get<string>('config.sms.phoneNumber'),
    };
  }

  get notifications() {
    return {
      push: this.configService.get<boolean>(
        'config.notifications.pushEnabled',
        true,
      ),
      sms: this.configService.get<boolean>(
        'config.notifications.smsEnabled',
        true,
      ),
      email: this.configService.get<boolean>(
        'config.notifications.emailEnabled',
        true,
      ),
    };
  }

  get pagination() {
    return {
      defaultPage: 1,
      defaultLimit: 20,
      maxLimit: 100,
    };
  }

  get files() {
    return {
      maxSize: this.configService.get<string>('config.files.maxSize', '5mb'),
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      uploadPath: this.configService.get<string>(
        'config.files.uploadPath',
        './uploads',
      ),
    };
  }

  getAll() {
    return {
      app: this.app,
      database: this.database,
      security: this.security,
      validation: this.validation,
      cache: this.cache,
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
    };
  }
}
