import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { DisputeResponseDTO } from './dispute.response.dto';

/// Cola de staff (`GET /admin/disputes`), paginada — mismo criterio que
/// `ContractsAuditListResponseDTO`.
export class DisputesQueueResponseDTO extends PaginatedResponse<DisputeResponseDTO> {
  @ApiProperty({ type: [DisputeResponseDTO] })
  declare data: DisputeResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
