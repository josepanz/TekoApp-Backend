import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { UserConsentAuditResponseDTO } from './user-consent-audit.response.dto';

export class LegalConsentsAuditListResponseDTO extends PaginatedResponse<UserConsentAuditResponseDTO> {
  @ApiProperty({ type: [UserConsentAuditResponseDTO] })
  declare data: UserConsentAuditResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
