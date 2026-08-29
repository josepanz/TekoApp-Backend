import { ApiPropertyOptional } from '@nestjs/swagger';
import { AiDisclosureEntityType, ContentUsageScope } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class GetContentConsentGrantsAuditQueryDTO extends PaginatedRequest<GetContentConsentGrantsAuditQueryDTO> {
  @ApiPropertyOptional({ enum: AiDisclosureEntityType })
  @IsOptional()
  @IsEnum(AiDisclosureEntityType)
  contentType?: AiDisclosureEntityType;

  @ApiPropertyOptional({ enum: ContentUsageScope })
  @IsOptional()
  @IsEnum(ContentUsageScope)
  usageScope?: ContentUsageScope;

  @ApiPropertyOptional({
    description: 'true = vigente (sin revocar), false = revocado',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  revoked?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por quien lo subió (referenceId)',
  })
  @IsOptional()
  @IsUUID('4')
  uploaderReferenceId?: string;
}
