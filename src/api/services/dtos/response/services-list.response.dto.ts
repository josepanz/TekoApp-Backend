import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { ServiceDetailResponseDTO } from './service-detail.response.dto';

export class ServicesListResponseDTO extends PaginatedResponse<ServiceDetailResponseDTO> {
  @ApiProperty({
    description: 'Lista de servicios',
    type: [ServiceDetailResponseDTO],
  })
  declare data: ServiceDetailResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
