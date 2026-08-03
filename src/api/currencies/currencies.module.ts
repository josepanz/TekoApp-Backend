import { Module } from '@nestjs/common';
import { CurrenciesController } from './controllers/currencies.controller';
import { CurrenciesService } from './services/currencies.service';
import { CurrenciesDbModule } from '@modules/currencies-db/currencies-db.module';

@Module({
  imports: [CurrenciesDbModule],
  controllers: [CurrenciesController],
  providers: [CurrenciesService],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
