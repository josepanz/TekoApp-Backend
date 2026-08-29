import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AcceptConsentParamDTO {
  @ApiProperty({
    description:
      'referenceId (UUID) de la versión del documento legal a aceptar',
    example: 'a3f1c2e4-1234-4a5b-8c9d-abcdef123456',
  })
  @IsUUID()
  versionReferenceId!: string;
}
