import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ServicesDbService } from './services/services-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [ServicesDbService],
  exports: [ServicesDbService],
})
export class ServicesDbModule {}
