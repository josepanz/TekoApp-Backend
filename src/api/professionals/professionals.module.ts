import { Module } from '@nestjs/common';
import { ProfessionalsDbModule } from '@modules/professionals-db/professionals-db.module';
import { ReportModule } from '@modules/report/report.module';
import { NotificationsApiModule } from '@api/notifications/notifications.module';
import { ProfessionalsController } from './controllers/professionals.controller';
import { AdminProfessionalsExportController } from './controllers/admin-professionals-export.controller';
import { ProfessionalsService } from './services/professionals.service';

@Module({
  imports: [ProfessionalsDbModule, ReportModule, NotificationsApiModule],
  controllers: [ProfessionalsController, AdminProfessionalsExportController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
