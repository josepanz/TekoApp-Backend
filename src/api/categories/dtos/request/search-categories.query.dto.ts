import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchCategoriesQueryDTO {
  @ApiProperty({
    description: 'Término o palabra clave de búsqueda',
    example: 'electricidad',
  })
  @IsString()
  @IsNotEmpty()
  q!: string;
}
