import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ProfessionalDocumentTypesDbService } from './services/professional-document-types-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [ProfessionalDocumentTypesDbService],
  exports: [ProfessionalDocumentTypesDbService],
})
export class ProfessionalDocumentTypesDbModule {}
