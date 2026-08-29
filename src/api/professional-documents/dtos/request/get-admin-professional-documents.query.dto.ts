import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory, DocumentReviewStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class GetAdminProfessionalDocumentsQueryDTO extends PaginatedRequest<GetAdminProfessionalDocumentsQueryDTO> {
  @ApiPropertyOptional({ enum: DocumentReviewStatus })
  @IsOptional()
  @IsEnum(DocumentReviewStatus)
  status?: DocumentReviewStatus;

  @ApiPropertyOptional({ enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;
}
