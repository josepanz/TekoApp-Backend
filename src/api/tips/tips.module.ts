import { Module } from '@nestjs/common';
import { TipsDbModule } from '@modules/tips-db/tips-db.module';
import { PaymentsDbModule } from '@modules/payments-db/payments-db.module';
import { TipsService } from './services/tips.service';
import { TipConfigController } from './controllers/tip-config.controller';
import { PaymentTipController } from './controllers/payment-tip.controller';

@Module({
  imports: [TipsDbModule, PaymentsDbModule],
  controllers: [TipConfigController, PaymentTipController],
  providers: [TipsService],
})
export class TipsModule {}
