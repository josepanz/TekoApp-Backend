import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class ApplyPromotionRequestDTO {
  @ApiProperty({
    description: 'Código de la promoción a aplicar',
    example: 'PROMO2025',
  })
  @IsString()
  @IsNotEmpty()
  promotionCode!: string;

  @ApiPropertyOptional({
    description: 'ID del servicio al que se aplica la promoción',
    example: 'a63b5212-db5e-4ef5-9614-726614174000',
  })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({
    description: 'Monto del servicio sobre el que se calcula el descuento',
    example: 150000,
  })
  @IsNumber()
  @Min(0)
  serviceAmount!: number;
}
