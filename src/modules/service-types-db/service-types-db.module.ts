import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ServiceTypesDbService } from './services/service-types-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [ServiceTypesDbService],
  exports: [ServiceTypesDbService],
})
export class ServiceTypesDbModule {}
