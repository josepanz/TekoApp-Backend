import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetProfessionalLocationParamDTO {
  @ApiProperty({
    description: 'ID Único del Profesional (UUIDv4)',
    example: 1,
  })
  @IsNumber()
  readonly id!: number;
}
