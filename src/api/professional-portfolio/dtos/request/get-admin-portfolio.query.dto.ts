import { ApiPropertyOptional } from '@nestjs/swagger';
import { PortfolioReviewStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class GetAdminPortfolioQueryDTO extends PaginatedRequest<GetAdminPortfolioQueryDTO> {
  @ApiPropertyOptional({ enum: PortfolioReviewStatus })
  @IsOptional()
  @IsEnum(PortfolioReviewStatus)
  status?: PortfolioReviewStatus;
}
