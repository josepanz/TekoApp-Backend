import { Module } from '@nestjs/common';
import { ServicesDbModule } from '@modules/services-db/services-db.module';
import { ServiceProgressDbModule } from '@modules/service-progress-db/service-progress-db.module';
import { BudgetsDbModule } from '@modules/budgets-db/budgets-db.module';

import { ServicesController } from './controllers/services.controller';
import { ServicesService } from './services/services.service';

@Module({
  imports: [ServicesDbModule, ServiceProgressDbModule, BudgetsDbModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
