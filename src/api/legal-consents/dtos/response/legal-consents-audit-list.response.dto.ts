import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { UserConsentResponseDTO } from './user-consent.response.dto';

export class LegalConsentsAuditListResponseDTO extends PaginatedResponse<UserConsentResponseDTO> {
  @ApiProperty({ type: [UserConsentResponseDTO] })
  declare data: UserConsentResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
