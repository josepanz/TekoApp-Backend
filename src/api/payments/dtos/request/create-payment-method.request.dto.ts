import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentProvider } from '@prisma/client';

export class CreatePaymentMethodRequestDTO {
  @ApiProperty({
    description: 'Nombre descriptivo del método de pago',
    example: 'Tarjeta Visa personal',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Tipo de método de pago', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  type!: PaymentMethod;

  @ApiProperty({ description: 'Proveedor de pagos', enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @ApiPropertyOptional({
    description: 'Establecer como método predeterminado',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Detalles adicionales del método (últimos 4 dígitos, etc.)',
    example: { cardLast4: '1234' },
  })
  @IsOptional()
  details?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'ID externo del proveedor (token de Stripe, etc.)',
  })
  @IsOptional()
  @IsString()
  externalId?: string;
}
