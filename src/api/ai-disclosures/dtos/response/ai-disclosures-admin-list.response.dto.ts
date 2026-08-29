import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { AiDisclosureResponseDTO } from './ai-disclosure.response.dto';

export class AiDisclosuresAdminListResponseDTO extends PaginatedResponse<AiDisclosureResponseDTO> {
  @ApiProperty({ type: [AiDisclosureResponseDTO] })
  declare data: AiDisclosureResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
