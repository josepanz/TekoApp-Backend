import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { AccountDeletionDbService } from './services/account-deletion-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [AccountDeletionDbService],
  exports: [AccountDeletionDbService],
})
export class AccountDeletionDbModule {}
