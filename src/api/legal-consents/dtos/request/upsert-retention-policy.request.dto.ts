import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { AiDisclosureEntityType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

// Upsert por (countryId, contentType) — ver `@@unique` del modelo. `countryId` ausente = política
// internacional/paraguas, misma convención que `LegalDocumentVersions`.
export class UpsertRetentionPolicyRequestDTO {
  @ApiPropertyOptional({
    description: 'País — omitir para política internacional',
  })
  @IsOptional()
  @IsInt()
  countryId?: number;

  @ApiProperty({ enum: AiDisclosureEntityType })
  @IsEnum(AiDisclosureEntityType)
  contentType!: AiDisclosureEntityType;

  @ApiPropertyOptional({
    description: 'Días de retención — omitir/null para retención indefinida',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  retentionDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowsUserDeletion?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresLegalHold?: boolean;
}
