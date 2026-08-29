import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentReviewStatus } from '@prisma/client';
import { ProfessionalDocumentTypeResponseDTO } from '@/api/professional-document-types/dtos/response';

export class ProfessionalDocumentResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty({ type: ProfessionalDocumentTypeResponseDTO })
  professionalDocumentType!: ProfessionalDocumentTypeResponseDTO;

  @ApiProperty({
    description:
      'Key de S3 — el cliente resuelve la URL presignada vía GET /uploads/presigned-url, mismo ' +
      'patrón que Services.images.',
  })
  fileKey!: string;

  @ApiProperty({ enum: DocumentReviewStatus })
  status!: DocumentReviewStatus;

  @ApiPropertyOptional()
  issuedAt!: Date | null;

  @ApiPropertyOptional()
  expiresAt!: Date | null;

  @ApiPropertyOptional()
  reviewedAt!: Date | null;

  @ApiPropertyOptional()
  rejectionReason!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
