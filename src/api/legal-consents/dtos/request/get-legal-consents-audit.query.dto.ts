import { ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class GetLegalConsentsAuditQueryDTO extends PaginatedRequest<GetLegalConsentsAuditQueryDTO> {
  @ApiPropertyOptional({ enum: LegalDocumentType })
  @IsOptional()
  @IsEnum(LegalDocumentType)
  documentType?: LegalDocumentType;

  @ApiPropertyOptional({ description: 'Filtrar por país (id interno)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por usuario (referenceId)' })
  @IsOptional()
  @IsUUID('4')
  userReferenceId?: string;
}
