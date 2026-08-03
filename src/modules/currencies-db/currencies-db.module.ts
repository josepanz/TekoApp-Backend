import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { CurrenciesDbService } from './services/currencies-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [CurrenciesDbService],
  exports: [CurrenciesDbService],
})
export class CurrenciesDbModule {}
