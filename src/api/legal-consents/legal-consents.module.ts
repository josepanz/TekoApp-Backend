import { Module } from '@nestjs/common';
import { LegalConsentsDbModule } from '@modules/legal-consents-db/legal-consents-db.module';
import { LegalConsentsController } from './controllers/legal-consents.controller';
import { AdminLegalConsentsController } from './controllers/admin-legal-consents.controller';
import { LegalConsentsService } from './services/legal-consents.service';
import { RequiresActiveConsentGuard } from './guards/requires-active-consent.guard';

@Module({
  imports: [LegalConsentsDbModule],
  controllers: [LegalConsentsController, AdminLegalConsentsController],
  providers: [LegalConsentsService, RequiresActiveConsentGuard],
  // RequiresActiveConsentGuard se exporta para que 0001/0002 (subida de documentos/fotos de
  // avance) lo apliquen en sus propios controllers importando este módulo — ver
  // openspec/specs/data-and-media-consent.md.
  exports: [LegalConsentsService, RequiresActiveConsentGuard],
})
export class LegalConsentsModule {}
