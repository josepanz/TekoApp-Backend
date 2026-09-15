import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePortfolioItemRequestDTO {
  @ApiPropertyOptional({ description: 'Descripción breve de la foto/trabajo' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string;
}
