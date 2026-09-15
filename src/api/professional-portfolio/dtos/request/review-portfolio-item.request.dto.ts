import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PortfolioReviewStatus } from '@prisma/client';
import { IsEnum, IsIn, IsString, MaxLength, ValidateIf } from 'class-validator';

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
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
