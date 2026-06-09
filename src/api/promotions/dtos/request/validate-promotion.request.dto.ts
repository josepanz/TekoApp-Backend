import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidatePromotionRequestDTO {
  @ApiProperty({ description: 'Código de la promoción', example: 'PROMO2025' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: 'Monto del servicio a aplicar la promoción',
    example: 150.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  serviceAmount!: number;
}
