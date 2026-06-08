import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { RatingType } from '@prisma/client';
import { UserSummaryResponseDTO } from './professional-detail.response.dto';

export class ReviewSummaryResponseDTO {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 3 })
  userId!: number;

  @ApiProperty({ example: 4.5 })
  rating!: number;

  @ApiPropertyOptional({ example: 'Excelente trabajo, muy puntual' })
  review?: string | null;

  @ApiProperty({ enum: RatingType, example: RatingType.CLIENT_TO_PROFESSIONAL })
  type!: RatingType;

  @ApiProperty({ example: false })
  isAnonymous!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ type: UserSummaryResponseDTO })
  user?: UserSummaryResponseDTO | null;
}

export class ProfessionalReviewsListResponseDTO extends PaginatedResponse<ReviewSummaryResponseDTO> {
  @ApiProperty({ type: [ReviewSummaryResponseDTO] })
  declare data: ReviewSummaryResponseDTO[];

  @ApiProperty({ type: PaginationResponseDTO })
  declare pagination: PaginationResponseDTO;
}
