import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { PaymentDbService } from './services/payment-db.service';
import { FeeCalculatorService } from './services/fee-calculator.service';

@Module({
  imports: [DatabaseModule],
  providers: [PaymentDbService, FeeCalculatorService],
  exports: [PaymentDbService, FeeCalculatorService],
})
export class PaymentsDbModule {}
