import { IsString, IsOptional, IsEnum, IsBoolean, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentProvider } from '../entities/payment.entity';

class PaymentMethodDetailsDto {
  @ApiProperty({
    description: 'Últimos 4 dígitos de la tarjeta',
    example: '1234',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardLast4?: string;

  @ApiProperty({
    description: 'Marca de la tarjeta',
    example: 'visa',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardBrand?: string;

  @ApiProperty({
    description: 'Mes de expiración de la tarjeta',
    example: 12,
    required: false,
  })
  @IsOptional()
  @IsString()
  cardExpMonth?: string;

  @ApiProperty({
    description: 'Año de expiración de la tarjeta',
    example: '2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardExpYear?: string;

  @ApiProperty({
    description: 'Nombre del titular de la tarjeta',
    example: 'Juan Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardholderName?: string;

  @ApiProperty({
    description: 'Nombre del banco',
    example: 'Banco Santander',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({
    description: 'Tipo de cuenta bancaria',
    example: 'checking',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountType?: string;

  @ApiProperty({
    description: 'Últimos 4 dígitos de la cuenta bancaria',
    example: '5678',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountLast4?: string;

  @ApiProperty({
    description: 'Número de ruta bancaria',
    example: '123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiProperty({
    description: 'Tipo de wallet digital',
    example: 'paypal',
    required: false,
  })
  @IsOptional()
  @IsString()
  walletType?: string;

  @ApiProperty({
    description: 'Email del wallet digital',
    example: 'usuario@paypal.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  walletEmail?: string;

  @ApiProperty({
    description: 'Dirección de crypto',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    required: false,
  })
  @IsOptional()
  @IsString()
  cryptoAddress?: string;

  @ApiProperty({
    description: 'Red de crypto',
    example: 'ethereum',
    required: false,
  })
  @IsOptional()
  @IsString()
  cryptoNetwork?: string;

  @ApiProperty({
    description: 'Token del proveedor de pagos',
    example: 'tok_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  providerToken?: string;
}

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Nombre del método de pago',
    example: 'Mi tarjeta Visa principal',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tipo de método de pago',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  type: PaymentMethod;

  @ApiProperty({
    description: 'Proveedor de pagos',
    enum: PaymentProvider,
    example: PaymentProvider.STRIPE,
  })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiProperty({
    description: 'Detalles del método de pago',
    type: PaymentMethodDetailsDto,
  })
  @ValidateNested()
  @Type(() => PaymentMethodDetailsDto)
  details: PaymentMethodDetailsDto;

  @ApiProperty({
    description: 'Si es el método de pago por defecto',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({
    description: 'ID externo del proveedor de pagos',
    example: 'pm_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({
    description: 'Fecha de expiración del método de pago',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({
    description: 'Metadatos adicionales',
    example: { source: 'mobile_app', deviceId: 'device_123' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
