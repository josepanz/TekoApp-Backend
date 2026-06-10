// dtos/request/create-payment.dto.ts
import { PaymentMethod, PaymentProvider } from '@prisma/client';
import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsUUID('4')
  userId: string;

  @IsNotEmpty()
  @IsString() // Services usa UUID estándar string en tu esquema
  serviceId: string;

  @IsNotEmpty()
  @IsUUID('4')
  professionalId: string;

  @IsNotEmpty()
  @IsUUID('4')
  serviceRequestId: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsString()
  currencyCode: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNotEmpty()
  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @IsOptional()
  @IsString()
  description?: string;
}
