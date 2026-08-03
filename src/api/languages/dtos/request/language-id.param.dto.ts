import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LanguageIdParamDTO {
  @ApiProperty({ description: 'ID del idioma', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
