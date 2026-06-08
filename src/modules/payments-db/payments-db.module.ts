// src/modules/payments/payments-db.module.ts
import { Module } from '@nestjs/common';
import { PaymentDbService } from './services/payment-db.service';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Module({
  imports: [PrismaDatasource],
  providers: [PaymentDbService],
  exports: [PaymentDbService],
})
export class PaymentsDbModule {}
