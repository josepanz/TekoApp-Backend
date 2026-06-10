// src/api/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsApiService } from './services/analytics.service';
import { AnalyticsDbModule } from '@modules/analytics-db/analytics-db.module';

@Module({
  imports: [AnalyticsDbModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsApiService],
})
export class AnalyticsModule {}
