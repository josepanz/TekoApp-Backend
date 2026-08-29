import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiDisclosureEntityType, ContentUsageScope } from '@prisma/client';

export class ContentConsentGrantResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público' })
  referenceId!: string;

  @ApiProperty({ enum: AiDisclosureEntityType })
  contentType!: AiDisclosureEntityType;

  @ApiProperty()
  contentReferenceId!: string;

  @ApiProperty({ enum: ContentUsageScope })
  usageScope!: ContentUsageScope;

  @ApiProperty()
  grantedAt!: Date;

  @ApiPropertyOptional()
  revokedAt!: Date | null;
}
