import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { RatingsDbService } from './services/ratings-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [RatingsDbService],
  exports: [RatingsDbService],
})
export class RatingsDbModule {}
