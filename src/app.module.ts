import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_CONFIG } from '@core/config/config-loader';
import { ScheduleModule } from '@nestjs/schedule';
import { I18nModule } from 'nestjs-i18n';

import { I18nConfig } from '@core/config/i18n.config';
import { DatabaseModule } from '@core/database/database.module';
import { ObservabilityInterceptor } from '@/core/interceptors/observability.interceptor';
import { TraceIdMiddleware } from '@/core/middlewares/trace-id.middleware';
import { RateLimitConfig } from '@core/config/rate-limit.config';
import { ObservabilityModule } from '@/modules/observability/observability.module';
import { ApiModule } from '@/api/api.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [APP_CONFIG],
    }),
    I18nModule.forRoot(I18nConfig.getOptions()),
    HealthModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    ApiModule,
    ObservabilityModule,
  ],
  controllers: [],
  providers: [ObservabilityInterceptor],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceIdMiddleware).forRoutes('*');

    // D-02 (openspec/changes/platform-hardening-2026-09/WORKPLAN.md): los limitadores `auth`,
    // `payment`, `upload` y `search` ya existían en RateLimitConfig pero nunca se aplicaban —
    // solo `general` corría (ver middleware.config.ts). El general SUMA, no reemplaza: un login
    // consume cupo de `general` (100/15min) Y de `auth` (5/15min); el más estricto es el que
    // efectivamente corta.
    //
    // Se cablea acá (vía MiddlewareConsumer.forRoutes) y no en middleware.config.ts porque ese
    // archivo es transversal a toda la API y no debe conocer rutas de dominio.
    const limiters = RateLimitConfig.createLimiter(this.configService);

    consumer.apply(limiters.auth).forRoutes(
      // Login y emisión de nonce/refresh son el blanco directo de fuerza bruta.
      { path: 'auth/login', method: RequestMethod.POST, version: '1' },
      { path: 'auth/nonce', method: RequestMethod.POST, version: '1' },
      { path: 'auth/refresh-token', method: RequestMethod.POST, version: '1' },
      // Recuperación de contraseña: mismo limitador estricto, mismo motivo (permite enumerar
      // emails / probar tokens si no se limita).
      { path: 'auth/forgot-password', method: RequestMethod.PUT, version: '1' },
      {
        path: 'auth/create-password',
        method: RequestMethod.POST,
        version: '1',
      },
      {
        path: 'auth/change-expired-password',
        method: RequestMethod.PUT,
        version: '1',
      },
      {
        path: 'auth/email/send-password-reset',
        method: RequestMethod.POST,
        version: '1',
      },
    );

    // Rutas enumeradas explícitamente (nada de comodín `*`): este stack usa Express 5, cuyo
    // `path-to-regexp` v8 exige comodines con nombre (`*splat`) y Nest resuelve `forRoutes()` con
    // su propio matcher interno — mezclar versiones de comodín es justo el tipo de discrepancia
    // silenciosa que esta tarea busca eliminar, no reintroducir.
    consumer.apply(limiters.payment).forRoutes(
      // El árbol de payments/* que muta (creación, transición de estado, métodos de pago,
      // propinas). Las lecturas (GET) quedan fuera: 20/hora sería demasiado estricto para
      // listados/consultas.
      { path: 'payments', method: RequestMethod.POST },
      { path: 'payments/:id', method: RequestMethod.PUT },
      { path: 'payments/:id/cancel', method: RequestMethod.POST },
      { path: 'payments/:id/refund', method: RequestMethod.POST },
      { path: 'payments/:id/tip', method: RequestMethod.POST },
      { path: 'payments/methods', method: RequestMethod.POST },
      { path: 'payments/methods/:id', method: RequestMethod.PUT },
      { path: 'payments/methods/:id', method: RequestMethod.DELETE },
    );

    consumer.apply(limiters.upload).forRoutes(
      // uploads/* (imagen, documento, avatar, docs de comercio) + los dos endpoints multipart de
      // documentos y portafolio profesional (usan FileInterceptor, no viven bajo /uploads).
      { path: 'uploads/image', method: RequestMethod.POST },
      { path: 'uploads/document', method: RequestMethod.POST },
      { path: 'uploads/avatar', method: RequestMethod.POST },
      { path: 'uploads/merchant-docs', method: RequestMethod.POST },
      { path: 'uploads/presigned-url', method: RequestMethod.GET },
      { path: 'uploads/info/:filename', method: RequestMethod.GET },
      { path: 'uploads/:filename', method: RequestMethod.DELETE },
      { path: 'professionals/me/documents', method: RequestMethod.POST },
      { path: 'professionals/me/portfolio', method: RequestMethod.POST },
    );

    consumer
      .apply(limiters.search)
      // El listado más pesado (Haversine sobre `professionals`, ver D-01).
      .forRoutes({ path: 'locations/nearby', method: RequestMethod.GET });
  }
}
