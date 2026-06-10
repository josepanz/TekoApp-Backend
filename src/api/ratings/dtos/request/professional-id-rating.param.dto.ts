import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProfessionalIdRatingParamDTO {
  @ApiProperty({ description: 'ID del profesional', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  professionalId!: number;
}
