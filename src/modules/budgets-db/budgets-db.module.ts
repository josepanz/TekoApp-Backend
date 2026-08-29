import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { BudgetsDbService } from './services/budgets-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [BudgetsDbService],
  exports: [BudgetsDbService],
})
export class BudgetsDbModule {}
