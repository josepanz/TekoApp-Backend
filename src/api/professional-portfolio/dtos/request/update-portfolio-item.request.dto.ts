import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePortfolioItemRequestDTO {
  @ApiPropertyOptional({ description: 'Descripción breve de la foto/trabajo' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string;

  @ApiPropertyOptional({
    description: 'Orden de aparición en la galería (menor = primero)',
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description:
      'Ocultado reactivo por el propio profesional — independiente del estado de revisión',
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
