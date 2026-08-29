import { Module } from '@nestjs/common';
import { TaxDbModule } from '@modules/tax-db/tax-db.module';
import { TaxService } from './services/tax.service';
import { TaxConfigController } from './controllers/tax-config.controller';

@Module({
  imports: [TaxDbModule],
  controllers: [TaxConfigController],
  providers: [TaxService],
  exports: [TaxService],
})
export class TaxModule {}
