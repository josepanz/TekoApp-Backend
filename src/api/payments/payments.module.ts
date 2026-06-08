import { Module } from '@nestjs/common';
import { PaymentsDbModule } from '@modules/payments-db/payments-db.module';
import { PaymentController } from './payments.controller';
import { PaymentApiService } from './payments.service';

@Module({
  imports: [PaymentsDbModule],
  controllers: [PaymentController],
  providers: [PaymentApiService],
  exports: [PaymentApiService],
})
export class PaymentsModule {}
