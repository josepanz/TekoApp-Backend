import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class GetCountriesListQueryDTO extends PaginatedRequest<GetCountriesListQueryDTO> {
  @ApiPropertyOptional({
    description:
      'Texto de búsqueda (nombre común/oficial o códigos ISO alfa-2/alfa-3)',
    example: 'Paraguay',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  search?: string;
}
