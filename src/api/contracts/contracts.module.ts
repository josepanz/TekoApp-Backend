import { Module } from '@nestjs/common';
import { ContractsDbModule } from '@modules/contracts-db/contracts-db.module';
import { BudgetsDbModule } from '@modules/budgets-db/budgets-db.module';
import { LegalConsentsDbModule } from '@modules/legal-consents-db/legal-consents-db.module';
import { StorageModule } from '@modules/storage/storage.module';
import { ReportModule } from '@modules/report/report.module';
import { ContractsService } from './services/contracts.service';
import { ContractsController } from './controllers/contracts.controller';
import { BudgetOptionContractController } from './controllers/budget-option-contract.controller';
import { AdminContractsController } from './controllers/admin-contracts.controller';

@Module({
  imports: [
    ContractsDbModule,
    BudgetsDbModule,
    LegalConsentsDbModule,
    StorageModule,
    ReportModule,
  ],
  controllers: [
    ContractsController,
    BudgetOptionContractController,
    AdminContractsController,
  ],
  providers: [ContractsService],
})
export class ContractsModule {}
