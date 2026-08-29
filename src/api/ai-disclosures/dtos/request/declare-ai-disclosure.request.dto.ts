import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiDisclosureEntityType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class DeclareAiDisclosureRequestDTO {
  @ApiProperty({ enum: AiDisclosureEntityType })
  @IsEnum(AiDisclosureEntityType)
  entityType!: AiDisclosureEntityType;

  @ApiProperty({
    description:
      'referenceId (UUID) del contenido propio que se declara asistido por IA',
    example: 'a3f1c2e4-1234-4a5b-8c9d-abcdef123456',
  })
  @IsUUID()
  entityReferenceId!: string;

  @ApiPropertyOptional({ description: 'Nota opcional sobre el uso de IA' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
