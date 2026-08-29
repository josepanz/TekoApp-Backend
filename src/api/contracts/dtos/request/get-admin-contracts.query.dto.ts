import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class GetAdminContractsQueryDTO extends PaginatedRequest<GetAdminContractsQueryDTO> {
  @ApiPropertyOptional({ enum: ContractStatus })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
