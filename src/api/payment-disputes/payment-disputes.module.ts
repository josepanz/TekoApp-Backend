import { Module } from '@nestjs/common';
import { PaymentsDbModule } from '@modules/payments-db/payments-db.module';
import { ProfessionalsDbModule } from '@modules/professionals-db/professionals-db.module';
import { PaymentDisputesDbModule } from '@modules/payment-disputes-db/payment-disputes-db.module';
import { PaymentDisputesController } from './controllers/payment-disputes.controller';
import { AdminDisputesController } from './controllers/admin-disputes.controller';
import { PaymentDisputesService } from './services/payment-disputes.service';

@Module({
  imports: [PaymentsDbModule, ProfessionalsDbModule, PaymentDisputesDbModule],
  controllers: [PaymentDisputesController, AdminDisputesController],
  providers: [PaymentDisputesService],
  exports: [PaymentDisputesService],
})
export class PaymentDisputesModule {}
