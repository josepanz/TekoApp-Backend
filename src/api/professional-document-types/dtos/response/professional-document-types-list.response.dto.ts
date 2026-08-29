import { ApiProperty } from '@nestjs/swagger';
import { ProfessionalDocumentTypeResponseDTO } from './professional-document-type.response.dto';

export class ProfessionalDocumentTypesListResponseDTO {
  @ApiProperty({ type: [ProfessionalDocumentTypeResponseDTO] })
  data!: ProfessionalDocumentTypeResponseDTO[];
}
