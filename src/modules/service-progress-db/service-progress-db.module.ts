import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ServiceProgressDbService } from './services/service-progress-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [ServiceProgressDbService],
  exports: [ServiceProgressDbService],
})
export class ServiceProgressDbModule {}
