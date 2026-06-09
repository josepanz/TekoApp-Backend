import { Module } from '@nestjs/common';
import { PromotionsDbModule } from '@modules/promotions-db/promotions-db.module';

import { PromotionsController } from './controllers/promotions.controller';
import { PromotionsService } from './services/promotions.service';

@Module({
  imports: [PromotionsDbModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
