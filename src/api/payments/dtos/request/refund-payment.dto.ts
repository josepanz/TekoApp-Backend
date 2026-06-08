import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RefundReason {
  CUSTOMER_REQUEST = 'customer_request',
  DUPLICATE_PAYMENT = 'duplicate_payment',
  FRAUD = 'fraud',
  SERVICE_NOT_PROVIDED = 'service_not_provided',
  POOR_SERVICE_QUALITY = 'poor_service_quality',
  TECHNICAL_ISSUE = 'technical_issue',
  OTHER = 'other',
}

export class RefundPaymentDto {
  @ApiProperty({
    description:
      'Monto a reembolsar (debe ser menor o igual al monto original)',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Motivo del reembolso',
    enum: RefundReason,
    example: RefundReason.CUSTOMER_REQUEST,
  })
  @IsEnum(RefundReason)
  reason: RefundReason;

  @ApiProperty({
    description: 'Descripción detallada del motivo del reembolso',
    example:
      'El cliente solicitó el reembolso debido a que el servicio no cumplió con las expectativas acordadas',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Metadatos adicionales del reembolso',
    example: {
      adminApproved: true,
      customerServiceNotes: 'Cliente insatisfecho',
    },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
