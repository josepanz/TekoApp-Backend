import { ApiPropertyOptional } from '@nestjs/swagger';
import { AiDisclosureEntityType, AiDisclosureSource } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class GetAiDisclosuresAdminQueryDTO extends PaginatedRequest<GetAiDisclosuresAdminQueryDTO> {
  @ApiPropertyOptional({ enum: AiDisclosureEntityType })
  @IsOptional()
  @IsEnum(AiDisclosureEntityType)
  entityType?: AiDisclosureEntityType;

  @ApiPropertyOptional({ enum: AiDisclosureSource })
  @IsOptional()
  @IsEnum(AiDisclosureSource)
  source?: AiDisclosureSource;
}
