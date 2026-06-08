// dtos/request/reverse-payment.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ReversePaymentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(10, {
    message: 'El motivo de la reversión debe ser más descriptivo.',
  })
  reason: string;
}
