import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiDisclosureEntityType, AiDisclosureSource } from '@prisma/client';

export class AiDisclosureResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público' })
  referenceId!: string;

  @ApiProperty({ enum: AiDisclosureEntityType })
  entityType!: AiDisclosureEntityType;

  @ApiProperty({ description: 'referenceId (UUID) del contenido referenciado' })
  entityReferenceId!: string;

  @ApiProperty({ enum: AiDisclosureSource })
  source!: AiDisclosureSource;

  @ApiPropertyOptional()
  aiProvider!: string | null;

  @ApiPropertyOptional()
  declaredByUserId!: number | null;

  @ApiPropertyOptional()
  note!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
