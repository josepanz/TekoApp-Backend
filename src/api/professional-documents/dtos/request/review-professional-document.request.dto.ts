import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentReviewStatus } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

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
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejectionReason?: string;
}
