import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentReviewStatus } from '@prisma/client';
import { ProfessionalDocumentTypeResponseDTO } from '@/api/professional-document-types/dtos/response';

export class ProfessionalDocumentResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty({ type: ProfessionalDocumentTypeResponseDTO })
  professionalDocumentType!: ProfessionalDocumentTypeResponseDTO;

  @ApiPropertyOptional({
    description:
      'Key de S3 — el cliente resuelve la URL presignada vía GET /uploads/presigned-url, mismo ' +
      'patrón que Services.images. `null` si la cuenta del profesional fue anonimizada (I-01): ' +
      'el objeto real se borra de S3, la fila se conserva como registro de que existió una ' +
      'verificación.',
  })
  fileKey!: string | null;

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
