import { Module } from '@nestjs/common';
import { ServicesDbModule } from '@modules/services-db/services-db.module';
import { ServiceProgressDbModule } from '@modules/service-progress-db/service-progress-db.module';
import { BudgetsDbModule } from '@modules/budgets-db/budgets-db.module';
import { NotificationsApiModule } from '@api/notifications/notifications.module';

import { ServicesController } from './controllers/services.controller';
import { ServicesService } from './services/services.service';

@Module({
  imports: [
    ServicesDbModule,
    ServiceProgressDbModule,
    BudgetsDbModule,
    NotificationsApiModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
