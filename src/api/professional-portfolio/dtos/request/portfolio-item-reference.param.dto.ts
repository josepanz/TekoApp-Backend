import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PortfolioItemReferenceParamDTO {
  @ApiProperty({ description: 'referenceId (UUID) de la foto de portafolio' })
  @IsUUID('4')
  referenceId!: string;
}
