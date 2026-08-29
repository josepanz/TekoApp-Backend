import { ApiProperty } from '@nestjs/swagger';
import { AiDisclosureEntityType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class AiDisclosureEntityParamDTO {
  @ApiProperty({ enum: AiDisclosureEntityType })
  @IsEnum(AiDisclosureEntityType)
  entityType!: AiDisclosureEntityType;

  @ApiProperty({
    description: 'referenceId (UUID) del contenido referenciado',
    example: 'a3f1c2e4-1234-4a5b-8c9d-abcdef123456',
  })
  @IsUUID()
  entityReferenceId!: string;
}
