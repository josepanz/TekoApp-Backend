import { Module } from '@nestjs/common';
import { ProfessionalDocumentTypesDbModule } from '@modules/professional-document-types-db/professional-document-types-db.module';
import {
  AdminProfessionalDocumentTypesController,
  ProfessionalDocumentTypesController,
} from './controllers/professional-document-types.controller';
import { ProfessionalDocumentTypesService } from './services/professional-document-types.service';

@Module({
  imports: [ProfessionalDocumentTypesDbModule],
  controllers: [
    ProfessionalDocumentTypesController,
    AdminProfessionalDocumentTypesController,
  ],
  providers: [ProfessionalDocumentTypesService],
  exports: [ProfessionalDocumentTypesService],
})
export class ProfessionalDocumentTypesModule {}
