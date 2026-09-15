import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PortfolioReviewStatus } from '@prisma/client';

export class PortfolioItemResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty({
    description:
      'Key de S3 — el cliente resuelve la URL presignada vía GET /uploads/presigned-url, mismo ' +
      'patrón que ProfessionalDocuments.fileKey.',
  })
  fileKey!: string;

  @ApiPropertyOptional()
  caption!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isVisible!: boolean;

  @ApiProperty({ enum: PortfolioReviewStatus })
  status!: PortfolioReviewStatus;

  @ApiPropertyOptional()
  reviewedAt!: Date | null;

  @ApiPropertyOptional()
  rejectionReason!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
