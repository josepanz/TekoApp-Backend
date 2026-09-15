import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { AdminPortfolioItemResponseDTO } from './admin-portfolio-item.response.dto';

export class AdminPortfolioItemsListResponseDTO extends PaginatedResponse<AdminPortfolioItemResponseDTO> {
  @ApiProperty({ type: [AdminPortfolioItemResponseDTO] })
  declare data: AdminPortfolioItemResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
