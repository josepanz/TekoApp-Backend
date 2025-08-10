import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportRatingDto {
  @ApiProperty({
    description: 'Motivo del reporte de la calificación',
    example: 'Esta calificación contiene lenguaje inapropiado y no refleja la realidad del servicio',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
