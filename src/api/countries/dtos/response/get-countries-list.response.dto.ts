import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { CountryResponseDTO } from './country.response.dto';

export class GetCountriesListResponseDTO extends PaginatedResponse<CountryResponseDTO> {
  @ApiProperty({ description: 'Lista de países', type: [CountryResponseDTO] })
  declare data: CountryResponseDTO[];

  @ApiProperty({ type: PaginationResponseDTO })
  declare pagination: PaginationResponseDTO;
}
