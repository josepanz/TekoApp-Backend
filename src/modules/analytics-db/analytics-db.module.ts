// src/modules/analytics-db/analytics-db.module.tsanalytics-db.module.ts
import { Module } from '@nestjs/common';
import { AnalyticsDbService } from './services/analytics-db.service';
import { PrismaDatasource } from '@core/database/services/prisma.service'; // O donde exportes tu PrismaService central

@Module({
  imports: [PrismaDatasource],
  providers: [AnalyticsDbService],
  exports: [AnalyticsDbService],
})
export class AnalyticsDbModule {}
