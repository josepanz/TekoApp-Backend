import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { PromotionsDbService } from './services/promotions-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [PromotionsDbService],
  exports: [PromotionsDbService],
})
export class PromotionsDbModule {}
