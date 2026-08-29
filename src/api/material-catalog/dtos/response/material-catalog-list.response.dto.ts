import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { MaterialCatalogItemResponseDTO } from './material-catalog-item.response.dto';

export class MaterialCatalogListResponseDTO extends PaginatedResponse<MaterialCatalogItemResponseDTO> {
  @ApiProperty({ type: [MaterialCatalogItemResponseDTO] })
  declare data: MaterialCatalogItemResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
