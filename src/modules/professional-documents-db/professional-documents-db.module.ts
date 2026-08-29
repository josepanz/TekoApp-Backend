import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ProfessionalDocumentTypesDbModule } from '@modules/professional-document-types-db/professional-document-types-db.module';
import { ProfessionalsDbModule } from '@modules/professionals-db/professionals-db.module';
import { ProfessionalDocumentsDbService } from './services/professional-documents-db.service';
import { ProfessionalVerificationHelper } from './helpers/professional-verification.helper';

@Module({
  imports: [
    DatabaseModule,
    ProfessionalDocumentTypesDbModule,
    ProfessionalsDbModule,
  ],
  providers: [ProfessionalDocumentsDbService, ProfessionalVerificationHelper],
  exports: [ProfessionalDocumentsDbService, ProfessionalVerificationHelper],
})
export class ProfessionalDocumentsDbModule {}
