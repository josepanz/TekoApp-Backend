import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { ContentConsentGrantAuditResponseDTO } from './content-consent-grant-audit.response.dto';

export class ContentConsentGrantsAuditListResponseDTO extends PaginatedResponse<ContentConsentGrantAuditResponseDTO> {
  @ApiProperty({ type: [ContentConsentGrantAuditResponseDTO] })
  declare data: ContentConsentGrantAuditResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
