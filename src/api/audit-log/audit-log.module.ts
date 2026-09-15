import { Module } from '@nestjs/common';
import { AuditLogDbModule } from '@modules/audit-log-db/audit-log-db.module';
import { AuditLogService } from './services/audit-log.service';
import { AdminAuditLogController } from './controllers/admin-audit-log.controller';

@Module({
  imports: [AuditLogDbModule],
  controllers: [AdminAuditLogController],
  providers: [AuditLogService],
})
export class AuditLogModule {}
