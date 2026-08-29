import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '@prisma/client';

export class ProfessionalDocumentTypeResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty({ enum: DocumentCategory })
  category!: DocumentCategory;

  @ApiPropertyOptional()
  countryId!: number | null;

  @ApiPropertyOptional()
  professionalCategoryId!: number | null;

  @ApiProperty()
  isRequired!: boolean;

  @ApiPropertyOptional({ description: 'null = no vence' })
  validityDays!: number | null;

  @ApiProperty()
  requiresStaffReview!: boolean;

  @ApiProperty()
  isVisibleToClient!: boolean;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isActive!: boolean;
}
