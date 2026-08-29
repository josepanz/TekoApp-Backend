import { Module } from '@nestjs/common';
import { ServiceProgressDbModule } from '@modules/service-progress-db/service-progress-db.module';
import { ServicesDbModule } from '@modules/services-db/services-db.module';
import { LegalConsentsDbModule } from '@modules/legal-consents-db/legal-consents-db.module';
import { ServiceProgressController } from './controllers/service-progress.controller';
import { ServiceProgressService } from './services/service-progress.service';

@Module({
  imports: [ServiceProgressDbModule, ServicesDbModule, LegalConsentsDbModule],
  controllers: [ServiceProgressController],
  providers: [ServiceProgressService],
})
export class ServiceProgressModule {}
