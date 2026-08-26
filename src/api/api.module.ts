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
import { ServiceTypesModule } from '@/api/service-types/service-types.module';
import { UploadsModule } from '@/api/uploads/uploads.module';
import { NotificationsApiModule } from '@/api/notifications/notifications.module';
import { UsersApiModule } from '@/api/users/users-api.module';
import { CountriesModule } from '@/api/countries/countries.module';
import { CurrenciesModule } from '@/api/currencies/currencies.module';
import { LanguagesModule } from '@/api/languages/languages.module';
import { LegalConsentsModule } from '@/api/legal-consents/legal-consents.module';
import { AiDisclosuresModule } from '@/api/ai-disclosures/ai-disclosures.module';

@Module({
  imports: [
    AuthApiModule,
    RolesApiModule,
    OnboardingApiModule,
    UsersApiModule,
    ProfessionalsModule,
    ServicesModule,
    ServiceTypesModule,
    LocationsModule,
    PaymentsModule,
    NotificationsApiModule,
    PromotionsModule,
    RatingsModule,
    CategoriesModule,
    UploadsModule,
    AnalyticsModule,
    CountriesModule,
    CurrenciesModule,
    LanguagesModule,
    LegalConsentsModule,
    AiDisclosuresModule,
  ],
})
export class ApiModule {}
