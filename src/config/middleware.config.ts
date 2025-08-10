import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as cors from 'cors';
import * as rateLimit from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { ValidationExceptionFilter } from '../filters/validation-exception.filter';

export class MiddlewareConfig {
  static setup(app: INestApplication, configService: ConfigService): void {
    // Configuración de seguridad con Helmet
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // Compresión de respuestas
    app.use(compression());

    // Configuración de CORS
    const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000').split(',');
    app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // límite de 100 requests por ventana
      message: {
        error: 'Demasiadas solicitudes desde esta IP, inténtalo de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Configuración global de prefijos
    app.setGlobalPrefix('api/v1');

    // Configuración de validación global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    // Configuración de interceptores globales
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
      new TransformInterceptor(),
    );

    // Configuración de filtros globales
    app.useGlobalFilters(
      new HttpExceptionFilter(),
      new ValidationExceptionFilter(),
    );
  }
}
