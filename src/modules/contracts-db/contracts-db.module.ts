import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ContractsDbService } from './services/contracts-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [ContractsDbService],
  exports: [ContractsDbService],
})
export class ContractsDbModule {}
