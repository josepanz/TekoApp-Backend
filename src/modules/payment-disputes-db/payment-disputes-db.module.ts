import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { PaymentsDbModule } from '@modules/payments-db/payments-db.module';
import { PaymentDisputesDbService } from './services/payment-disputes-db.service';

@Module({
  imports: [DatabaseModule, PaymentsDbModule],
  providers: [PaymentDisputesDbService],
  exports: [PaymentDisputesDbService],
})
export class PaymentDisputesDbModule {}
