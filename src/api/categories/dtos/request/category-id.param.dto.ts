import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CategoryIdParamDTO {
  @ApiProperty({ description: 'ID de la categoría', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
