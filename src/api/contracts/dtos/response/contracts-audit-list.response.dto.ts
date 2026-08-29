import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { ContractAuditResponseDTO } from './contract-audit.response.dto';

export class ContractsAuditListResponseDTO extends PaginatedResponse<ContractAuditResponseDTO> {
  @ApiProperty({ type: [ContractAuditResponseDTO] })
  declare data: ContractAuditResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
