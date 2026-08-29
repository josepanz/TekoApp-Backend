import { Module } from '@nestjs/common';
import { BudgetsDbModule } from '@modules/budgets-db/budgets-db.module';
import { ServicesDbModule } from '@modules/services-db/services-db.module';
import { MaterialCatalogDbModule } from '@modules/material-catalog-db/material-catalog-db.module';
import { BudgetsController } from './controllers/budgets.controller';
import { BudgetsService } from './services/budgets.service';

@Module({
  imports: [BudgetsDbModule, ServicesDbModule, MaterialCatalogDbModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
