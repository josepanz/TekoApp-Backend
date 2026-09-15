import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class GetAuditLogsQueryDTO extends PaginatedRequest<GetAuditLogsQueryDTO> {
  @ApiPropertyOptional({ description: 'Tabla auditada (match exacto)' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({
    description: 'Id del registro auditado (match exacto)',
  })
  @IsOptional()
  @IsString()
  recordId?: string;

  @ApiPropertyOptional({ description: 'Quién hizo el cambio (match exacto)' })
  @IsOptional()
  @IsString()
  changedBy?: string;
}
