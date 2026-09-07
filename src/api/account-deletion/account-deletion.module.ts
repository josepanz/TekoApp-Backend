import { Module } from '@nestjs/common';
import { AccountDeletionDbModule } from '@modules/account-deletion-db/account-deletion-db.module';
import { ProfessionalsDbModule } from '@modules/professionals-db/professionals-db.module';
import { ServicesDbModule } from '@modules/services-db/services-db.module';
import { PaymentsDbModule } from '@modules/payments-db/payments-db.module';
import { ContractsDbModule } from '@modules/contracts-db/contracts-db.module';
import { StorageModule } from '@modules/storage/storage.module';
import { AccountDeletionController } from './controllers/account-deletion.controller';
import { AccountDeletionService } from './services/account-deletion.service';
import { AccountDeletionAnonymizationJob } from './jobs/account-deletion-anonymization.job';

@Module({
  imports: [
    AccountDeletionDbModule,
    ProfessionalsDbModule,
    ServicesDbModule,
    PaymentsDbModule,
    ContractsDbModule,
    StorageModule,
  ],
  controllers: [AccountDeletionController],
  providers: [AccountDeletionService, AccountDeletionAnonymizationJob],
})
export class AccountDeletionModule {}
