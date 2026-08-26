import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';

export class LegalDocumentVersionResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público' })
  referenceId!: string;

  @ApiProperty({ enum: LegalDocumentType })
  documentType!: LegalDocumentType;

  @ApiPropertyOptional({
    description: 'País — null si es internacional/paraguas',
  })
  countryId!: number | null;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  contentUrl!: string;

  @ApiProperty()
  publishedAt!: Date;

  @ApiProperty()
  isActive!: boolean;
}
