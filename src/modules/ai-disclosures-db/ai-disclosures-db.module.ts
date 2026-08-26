import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { AiDisclosuresDbService } from './services/ai-disclosures-db.service';
import { AiDisclosureHelper } from './helpers/ai-disclosure.helper';

@Module({
  imports: [DatabaseModule],
  providers: [AiDisclosuresDbService, AiDisclosureHelper],
  // AiDisclosureHelper se exporta para que una futura feature de IA de plataforma lo importe y
  // registre su propio disclosure al generar contenido — ver
  // openspec/specs/ai-content-disclosure.md. Sin caller real todavía.
  exports: [AiDisclosuresDbService, AiDisclosureHelper],
})
export class AiDisclosuresDbModule {}
