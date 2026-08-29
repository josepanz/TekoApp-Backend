import { Module } from '@nestjs/common';
import { PaymentsDbModule } from '@modules/payments-db/payments-db.module';
import { TaxModule } from '@api/tax/tax.module';
import { PaymentController } from './controllers/payments.controller';
import { PaymentApiService } from './services/payments.service';

@Module({
  imports: [PaymentsDbModule, TaxModule],
  controllers: [PaymentController],
  providers: [PaymentApiService],
  exports: [PaymentApiService],
})
export class PaymentsModule {}
