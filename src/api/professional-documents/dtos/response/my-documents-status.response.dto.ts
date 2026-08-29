import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalDocumentTypeResponseDTO } from '@/api/professional-document-types/dtos/response';
import { ProfessionalDocumentResponseDTO } from './professional-document.response.dto';

/** Un tipo aplicable al profesional (requerido u opcional), con su documento más reciente si ya
 *  cargó alguno — `document: null` significa "todavía no cargó nada para este tipo". */
export class MyDocumentStatusResponseDTO {
  @ApiProperty({ type: ProfessionalDocumentTypeResponseDTO })
  documentType!: ProfessionalDocumentTypeResponseDTO;

  @ApiPropertyOptional({ type: ProfessionalDocumentResponseDTO })
  document!: ProfessionalDocumentResponseDTO | null;
}

export class MyDocumentsListResponseDTO {
  @ApiProperty({ type: [MyDocumentStatusResponseDTO] })
  data!: MyDocumentStatusResponseDTO[];
}
