import { Module } from '@nestjs/common';
import { AiDisclosuresDbModule } from '@modules/ai-disclosures-db/ai-disclosures-db.module';
import { ServicesDbModule } from '@modules/services-db/services-db.module';
import { ProfessionalsDbModule } from '@modules/professionals-db/professionals-db.module';
import { AiDisclosuresController } from './controllers/ai-disclosures.controller';
import { AdminAiDisclosuresController } from './controllers/admin-ai-disclosures.controller';
import { AiDisclosuresService } from './services/ai-disclosures.service';

@Module({
  imports: [AiDisclosuresDbModule, ServicesDbModule, ProfessionalsDbModule],
  controllers: [AiDisclosuresController, AdminAiDisclosuresController],
  providers: [AiDisclosuresService],
  exports: [AiDisclosuresService],
})
export class AiDisclosuresModule {}
