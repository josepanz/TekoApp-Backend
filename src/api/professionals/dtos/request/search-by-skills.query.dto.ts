import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class SearchBySkillsQueryDTO extends PaginatedRequest<SearchBySkillsQueryDTO> {
  @ApiProperty({
    description: 'Habilidades separadas por comas',
    example: 'plomería,electricidad',
  })
  @IsString()
  @IsNotEmpty()
  skills!: string;
}
