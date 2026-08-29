import { ApiProperty } from '@nestjs/swagger';
import { ContentConsentGrantResponseDTO } from './content-consent-grant.response.dto';
import { LegalConsentUserSummaryResponseDTO } from './legal-consent-user-summary.response.dto';

/** Grant + quién lo subió — solo para el panel de auditoría de staff. */
export class ContentConsentGrantAuditResponseDTO extends ContentConsentGrantResponseDTO {
  @ApiProperty({ type: LegalConsentUserSummaryResponseDTO })
  uploader!: LegalConsentUserSummaryResponseDTO;
}
