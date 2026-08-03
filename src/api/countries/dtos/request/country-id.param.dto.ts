import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CountryIdParamDTO {
  @ApiProperty({ description: 'ID del país', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
