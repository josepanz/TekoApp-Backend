import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RevokeContentConsentParamDTO {
  @ApiProperty({
    description:
      'referenceId (UUID) del contenido cuyo consentimiento de uso se revoca',
    example: 'a3f1c2e4-1234-4a5b-8c9d-abcdef123456',
  })
  @IsUUID()
  contentReferenceId!: string;
}
