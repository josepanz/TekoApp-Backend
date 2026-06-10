import { PartialType } from '@nestjs/swagger';
import { CreatePaymentMethodRequestDTO } from './create-payment-method.request.dto';

export class UpdatePaymentMethodDto extends PartialType(
  CreatePaymentMethodRequestDTO,
) {}
