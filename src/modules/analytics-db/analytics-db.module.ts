import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { AnalyticsDbService } from './services/analytics-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [AnalyticsDbService],
  exports: [AnalyticsDbService],
})
export class AnalyticsDbModule {}
