import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';

import { RatingsController } from './controllers/ratings.controller';
import { RatingsService } from './services/ratings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
