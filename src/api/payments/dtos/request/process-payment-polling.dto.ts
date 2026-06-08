// dtos/request/process-payment-polling.dto.ts
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';

export enum PollingStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export class ProcessPaymentPollingDto {
  @IsNotEmpty()
  @IsUUID('4')
  paymentId: string;

  @IsNotEmpty()
  @IsString()
  externalTransactionId: string;

  @IsNotEmpty()
  @IsEnum(PollingStatus)
  status: PollingStatus;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsNotEmpty()
  @IsObject()
  rawDetails: Record<string, unknown>; // Tipado estricto para objetos dinámicos conocidos
}
