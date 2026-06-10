import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';
import { RateLimitConfig } from './rate-limit.config';
import { ValidationConfig } from './validation.config';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { ObservabilityInterceptor } from '@/core/interceptors/observability.interceptor';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../../common/filters/validation-exception.filter';
import { AllExceptionsFilter } from '@/core/filters/http-exception.filter';

export class MiddlewareConfig {
  static setup(app: INestApplication, configService: ConfigService): void {
    // 1. Inyección de cabeceras de seguridad extrema (Helmet)
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      }),
    );

    // 2. Compresión gzip/deflate para respuestas de la API
    app.use(compression());

    // 3. Configuración centralizada de CORS
    const allowedOrigins = configService
      .get<string>(
        'ALLOWED_ORIGINS',
        'http://localhost:3000,http://localhost:3001',
      )
      .split(',');
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // 4. Rate Limiting corporativo respaldado en tu Singleton de Redis
    const limiters = RateLimitConfig.createLimiter(configService);
    app.use(limiters.general);

    // 5. Tubería de validación global unificada (utiliza la configuración limpia y estricta)
    app.useGlobalPipes(
      new ValidationPipe(ValidationConfig.getValidationOptions()),
    );

    // 6. Interceptores Globales en orden secuencial de ejecución
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
      new TransformInterceptor(),
      app.get(ObservabilityInterceptor),
    );

    // 7. Filtros globales interceptores de excepciones catastróficas o de negocio
    app.useGlobalFilters(
      new AllExceptionsFilter(),
      new HttpExceptionFilter(),
      new ValidationExceptionFilter(),
    );
  }
}
