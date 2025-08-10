import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RateServiceDto {
  @ApiProperty({ description: 'Calificación del 1 al 5', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentario de la calificación' })
  @IsOptional()
  @IsString()
  review?: string;
}
