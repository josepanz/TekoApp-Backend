import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { AdminProfessionalDocumentResponseDTO } from './admin-professional-document.response.dto';

export class AdminProfessionalDocumentsListResponseDTO extends PaginatedResponse<AdminProfessionalDocumentResponseDTO> {
  @ApiProperty({ type: [AdminProfessionalDocumentResponseDTO] })
  declare data: AdminProfessionalDocumentResponseDTO[];

  @ApiProperty()
  declare pagination: PaginationResponseDTO;
}
