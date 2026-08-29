import { ApiProperty } from '@nestjs/swagger';
import { ProfessionalDocumentResponseDTO } from './professional-document.response.dto';

export class ProfessionalDocumentsListResponseDTO {
  @ApiProperty({ type: [ProfessionalDocumentResponseDTO] })
  data!: ProfessionalDocumentResponseDTO[];
}
