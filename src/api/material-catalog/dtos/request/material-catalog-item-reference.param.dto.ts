import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MaterialCatalogItemReferenceParamDTO {
  @ApiProperty({ description: 'referenceId (UUID) del ítem de catálogo' })
  @IsUUID('4')
  referenceId!: string;
}
