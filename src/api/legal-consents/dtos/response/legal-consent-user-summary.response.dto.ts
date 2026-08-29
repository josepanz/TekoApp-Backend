import { ApiProperty } from '@nestjs/swagger';

/** Mismo patrón que `AdminQueueProfessionalSummaryResponseDTO` (professional-documents). */
export class LegalConsentUserSummaryResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;
}
