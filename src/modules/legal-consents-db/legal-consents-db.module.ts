import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { LegalConsentsDbService } from './services/legal-consents-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [LegalConsentsDbService],
  exports: [LegalConsentsDbService],
})
export class LegalConsentsDbModule {}
