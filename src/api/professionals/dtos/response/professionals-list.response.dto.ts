import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { ProfessionalDetailResponseDTO } from './professional-detail.response.dto';

export class ProfessionalsListResponseDTO extends PaginatedResponse<ProfessionalDetailResponseDTO> {
  @ApiProperty({ type: [ProfessionalDetailResponseDTO] })
  declare data: ProfessionalDetailResponseDTO[];

  @ApiProperty({ type: PaginationResponseDTO })
  declare pagination: PaginationResponseDTO;
}
