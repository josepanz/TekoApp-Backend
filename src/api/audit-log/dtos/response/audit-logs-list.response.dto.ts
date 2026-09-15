import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { AuditLogResponseDTO } from './audit-log.response.dto';

export class AuditLogsListResponseDTO extends PaginatedResponse<AuditLogResponseDTO> {
  @ApiProperty({ type: [AuditLogResponseDTO] })
  declare data: AuditLogResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
