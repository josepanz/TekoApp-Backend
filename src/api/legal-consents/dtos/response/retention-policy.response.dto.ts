import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiDisclosureEntityType } from '@prisma/client';

export class RetentionPolicyResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público' })
  referenceId!: string;

  @ApiPropertyOptional({
    description: 'País — null si es política internacional',
  })
  countryId!: number | null;

  @ApiProperty({ enum: AiDisclosureEntityType })
  contentType!: AiDisclosureEntityType;

  @ApiPropertyOptional()
  retentionDays!: number | null;

  @ApiProperty()
  allowsUserDeletion!: boolean;

  @ApiProperty()
  requiresLegalHold!: boolean;
}
