import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { PaymentDbService } from './services/payment-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [PaymentDbService],
  exports: [PaymentDbService],
})
export class PaymentsDbModule {}
