import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LegalDocumentVersionIdParamDTO {
  @ApiProperty({ description: 'referenceId (UUID) de la versión' })
  @IsUUID()
  referenceId!: string;
}
