import { ApiProperty } from '@nestjs/swagger';
import { ProfessionalDocumentResponseDTO } from './professional-document.response.dto';

class AdminQueueProfessionalSummaryResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;
}

/** Documento + contexto del profesional dueño — solo para la cola de revisión de staff. */
export class AdminProfessionalDocumentResponseDTO extends ProfessionalDocumentResponseDTO {
  @ApiProperty({ type: AdminQueueProfessionalSummaryResponseDTO })
  professional!: AdminQueueProfessionalSummaryResponseDTO;
}
