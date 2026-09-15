import { ApiProperty } from '@nestjs/swagger';
import { PortfolioItemResponseDTO } from './portfolio-item.response.dto';

class AdminQueueProfessionalSummaryResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;
}

/** Foto + contexto del profesional dueño — solo para la cola de revisión de staff. */
export class AdminPortfolioItemResponseDTO extends PortfolioItemResponseDTO {
  @ApiProperty({ type: AdminQueueProfessionalSummaryResponseDTO })
  professional!: AdminQueueProfessionalSummaryResponseDTO;
}
