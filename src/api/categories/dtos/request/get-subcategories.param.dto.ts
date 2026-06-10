import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetSubcategoriesParamDTO {
  @ApiProperty({ description: 'ID de la categoría padre', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId!: number;
}
