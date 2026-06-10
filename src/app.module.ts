import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_CONFIG } from '@core/config/config-loader';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from '@core/database/database.module';
import { ObservabilityInterceptor } from '@/core/interceptors/observability.interceptor';
import { TraceIdMiddleware } from '@/core/middlewares/trace-id.middleware';
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
    HealthModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    ApiModule,
    ObservabilityModule,
  ],
  controllers: [],
  providers: [ObservabilityInterceptor],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
