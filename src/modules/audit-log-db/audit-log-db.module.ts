import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { AuditLogDbService } from './services/audit-log-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [AuditLogDbService],
  exports: [AuditLogDbService],
})
export class AuditLogDbModule {}
