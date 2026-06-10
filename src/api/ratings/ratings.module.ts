import { Module } from '@nestjs/common';
import { RatingsDbModule } from '@modules/ratings-db/ratings-db.module';

import { RatingsController } from './controllers/ratings.controller';
import { RatingsService } from './services/ratings.service';

@Module({
  imports: [RatingsDbModule],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
