import { ApiProperty } from '@nestjs/swagger';
import { PortfolioItemResponseDTO } from './portfolio-item.response.dto';

export class PortfolioItemsListResponseDTO {
  @ApiProperty({ type: [PortfolioItemResponseDTO] })
  data!: PortfolioItemResponseDTO[];
}
