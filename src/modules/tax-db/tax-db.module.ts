import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { TaxDbService } from './services/tax-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [TaxDbService],
  exports: [TaxDbService],
})
export class TaxDbModule {}
