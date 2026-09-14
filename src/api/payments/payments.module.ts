import { Module } from '@nestjs/common';
import { PaymentsDbModule } from '@modules/payments-db/payments-db.module';
import { TaxModule } from '@api/tax/tax.module';
import { ReportModule } from '@modules/report/report.module';
import { NotificationsApiModule } from '@api/notifications/notifications.module';
import { UsersDBModule } from '@modules/users-db/users-db.module';
import { EmailModule } from '@modules/email/email.module';
import { PaymentController } from './controllers/payments.controller';
import { AdminPaymentsController } from './controllers/admin-payments.controller';
import { PaymentApiService } from './services/payments.service';

@Module({
  imports: [
    PaymentsDbModule,
    TaxModule,
    ReportModule,
    NotificationsApiModule,
    UsersDBModule,
    EmailModule,
  ],
  controllers: [PaymentController, AdminPaymentsController],
  providers: [PaymentApiService],
  exports: [PaymentApiService],
})
export class PaymentsModule {}
