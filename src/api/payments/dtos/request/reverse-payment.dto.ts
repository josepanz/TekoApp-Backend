// dtos/request/reverse-payment.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ReversePaymentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(10, {
    message: i18nValidationMessage('validation.REVERSAL_REASON_TOO_SHORT'),
  })
  reason: string;
}
