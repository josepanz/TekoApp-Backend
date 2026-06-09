import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';

import { PromotionsController } from './controllers/promotions.controller';
import { PromotionsService } from './services/promotions.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
