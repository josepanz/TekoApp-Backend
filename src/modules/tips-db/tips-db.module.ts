import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { TipsDbService } from './services/tips-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [TipsDbService],
  exports: [TipsDbService],
})
export class TipsDbModule {}
