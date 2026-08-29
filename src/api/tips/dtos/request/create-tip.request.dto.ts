import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipMode } from '@prisma/client';
import { IsEnum, IsNumber, Max, Min, ValidateIf } from 'class-validator';

export class CreateTipRequestDTO {
  @ApiProperty({
    enum: TipMode,
    example: TipMode.PERCENTAGE,
    description:
      'PERCENTAGE calcula el monto server-side desde `percentage`. FIXED/FREE mandan `amount` ' +
      'directo — la distinción entre ambos es de UI/analítica (preset vs. monto libre), no cambia ' +
      'el cálculo.',
  })
  @IsEnum(TipMode)
  mode!: TipMode;

  @ApiPropertyOptional({
    example: 10,
    description: 'Requerido cuando mode=PERCENTAGE (1-100).',
  })
  @ValidateIf((dto: CreateTipRequestDTO) => dto.mode === TipMode.PERCENTAGE)
  @IsNumber()
  @Min(1)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({
    example: 15000,
    description: 'Requerido cuando mode=FIXED o mode=FREE.',
  })
  @ValidateIf((dto: CreateTipRequestDTO) => dto.mode !== TipMode.PERCENTAGE)
  @IsNumber()
  @Min(0.01)
  amount?: number;
}
