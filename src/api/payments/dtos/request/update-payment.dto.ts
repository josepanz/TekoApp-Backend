import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.dto';

export class UpdatePaymentDto extends PartialType(
  OmitType(CreatePaymentDto, ['professionalId', 'serviceId'] as const),
) {}
