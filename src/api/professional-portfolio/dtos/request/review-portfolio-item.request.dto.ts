import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PortfolioReviewStatus } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class ReviewPortfolioItemRequestDTO {
  @ApiProperty({
    enum: [PortfolioReviewStatus.APPROVED, PortfolioReviewStatus.REJECTED],
  })
  @IsEnum(PortfolioReviewStatus)
  @IsIn([PortfolioReviewStatus.APPROVED, PortfolioReviewStatus.REJECTED])
  status!: PortfolioReviewStatus;

  @ApiPropertyOptional({ description: 'Obligatorio cuando status=REJECTED' })
  @ValidateIf(
    (dto: ReviewPortfolioItemRequestDTO) =>
      dto.status === PortfolioReviewStatus.REJECTED,
  )
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejectionReason?: string;
}
