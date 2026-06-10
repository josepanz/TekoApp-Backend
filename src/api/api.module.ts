import { Module } from '@nestjs/common';
import { AuthApiModule } from './auth/auth-api.module';
import { RolesApiModule } from './roles-permission/roles-permission.module';
import { OnboardingApiModule } from '@api/onboarding/onboarding-api.module';
import { AnalyticsModule } from '@/api/analytics/analytics.module';
import { CategoriesModule } from '@/api/categories/categories.module';
import { LocationsModule } from '@/api/locations/locations.module';
import { PaymentsModule } from '@/api/payments/payments.module';
import { ProfessionalsModule } from '@/api/professionals/professionals.module';
import { PromotionsModule } from '@/api/promotions/promotions.module';
import { RatingsModule } from '@/api/ratings';
import { ServicesModule } from '@/api/services/services.module';
import { UploadsModule } from '@/api/uploads/uploads.module';
import { NotificationsApiModule } from '@/api/notifications/notifications.module';
import { UsersApiModule } from '@/api/users/users-api.module';

@Module({
  imports: [
    AuthApiModule,
    RolesApiModule,
    OnboardingApiModule,
    UsersApiModule,
    ProfessionalsModule,
    ServicesModule,
    LocationsModule,
    PaymentsModule,
    NotificationsApiModule,
    PromotionsModule,
    RatingsModule,
    CategoriesModule,
    UploadsModule,
    AnalyticsModule,
  ],
})
export class ApiModule {}
