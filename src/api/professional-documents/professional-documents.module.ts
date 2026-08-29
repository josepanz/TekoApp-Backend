import { Module } from '@nestjs/common';
import { ProfessionalDocumentsDbModule } from '@modules/professional-documents-db/professional-documents-db.module';
import { ProfessionalDocumentTypesDbModule } from '@modules/professional-document-types-db/professional-document-types-db.module';
import { ProfessionalsDbModule } from '@modules/professionals-db/professionals-db.module';
import { StorageModule } from '@modules/storage/storage.module';
import { LegalConsentsModule } from '@api/legal-consents/legal-consents.module';
import { LegalConsentsDbModule } from '@modules/legal-consents-db/legal-consents-db.module';
import { NotificationsApiModule } from '@api/notifications/notifications.module';
import { AdminProfessionalDocumentsController } from './controllers/admin-professional-documents.controller';
import { ProfessionalDocumentsController } from './controllers/professional-documents.controller';
import { ProfessionalDocumentsService } from './services/professional-documents.service';
import { ProfessionalDocumentsExpirationJob } from './jobs/professional-documents-expiration.job';

@Module({
  imports: [
    ProfessionalDocumentsDbModule,
    ProfessionalDocumentTypesDbModule,
    ProfessionalsDbModule,
    StorageModule,
    LegalConsentsModule,
    LegalConsentsDbModule,
    NotificationsApiModule,
  ],
  controllers: [
    ProfessionalDocumentsController,
    AdminProfessionalDocumentsController,
  ],
  providers: [ProfessionalDocumentsService, ProfessionalDocumentsExpirationJob],
})
export class ProfessionalDocumentsModule {}
