import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_CONFIG } from '@core/config/config-loader';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from '@core/database/database.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfessionalsModule } from './api/professionals/professionals.module';
import { ServicesModule } from './api/services/services.module';
import { LocationsModule } from './api/locations/locations.module';
import { PaymentsModule } from './api/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PromotionsModule } from './api/promotions/promotions.module';
import { RatingsModule } from './api/ratings/ratings.module';
import { CategoriesModule } from './api/categories/categories.module';
import { UploadsModule } from './api/uploads/uploads.module';
import { AnalyticsModule } from './api/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [APP_CONFIG],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProfessionalsModule,
    ServicesModule,
    LocationsModule,
    PaymentsModule,
    NotificationsModule,
    PromotionsModule,
    RatingsModule,
    CategoriesModule,
    UploadsModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
