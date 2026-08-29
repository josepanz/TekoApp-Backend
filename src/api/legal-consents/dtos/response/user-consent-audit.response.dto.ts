import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserConsentResponseDTO } from './user-consent.response.dto';
import { LegalConsentUserSummaryResponseDTO } from './legal-consent-user-summary.response.dto';

/**
 * Extiende `UserConsentResponseDTO` (usado también como respuesta de `POST .../accept`) con los
 * campos que solo tienen sentido en la auditoría de staff — IP/user-agent/hash y quién aceptó.
 * Separado del DTO base para no cambiar el contrato de `ApiAcceptConsent`.
 */
export class UserConsentAuditResponseDTO extends UserConsentResponseDTO {
  @ApiProperty({ type: LegalConsentUserSummaryResponseDTO })
  user!: LegalConsentUserSummaryResponseDTO;

  @ApiPropertyOptional()
  ipAddress!: string | null;

  @ApiPropertyOptional()
  userAgent!: string | null;

  @ApiProperty()
  acceptanceHash!: string;
}
