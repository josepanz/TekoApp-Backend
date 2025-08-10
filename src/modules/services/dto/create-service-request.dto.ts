import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceRequestDto {
  @ApiPropertyOptional({ description: 'Precio propuesto por el profesional' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  proposedPrice?: number;

  @ApiPropertyOptional({ description: 'Horas propuestas por el profesional' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  proposedHours?: number;

  @ApiPropertyOptional({ description: 'Mensaje del profesional al cliente' })
  @IsOptional()
  @IsString()
  message?: string;
}
