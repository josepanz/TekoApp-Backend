import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentReviewStatus } from '@prisma/client';
import { IsEnum, IsIn, IsString, MaxLength, ValidateIf } from 'class-validator';

export class ReviewProfessionalDocumentRequestDTO {
  @ApiProperty({
    enum: [DocumentReviewStatus.APPROVED, DocumentReviewStatus.REJECTED],
  })
  @IsEnum(DocumentReviewStatus)
  @IsIn([DocumentReviewStatus.APPROVED, DocumentReviewStatus.REJECTED])
  status!: DocumentReviewStatus;

  @ApiPropertyOptional({ description: 'Obligatorio cuando status=REJECTED' })
  @ValidateIf(
    (dto: ReviewProfessionalDocumentRequestDTO) =>
      dto.status === DocumentReviewStatus.REJECTED,
  )
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
