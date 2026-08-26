import { ApiProperty } from '@nestjs/swagger';
import { LegalDocumentVersionResponseDTO } from './legal-document-version.response.dto';

export class UserConsentResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público' })
  referenceId!: string;

  @ApiProperty()
  acceptedAt!: Date;

  @ApiProperty({ type: LegalDocumentVersionResponseDTO })
  legalDocumentVersion!: LegalDocumentVersionResponseDTO;
}
