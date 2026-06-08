import { PartialType } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment-method.dto';

export class UpdatePaymentMethodDto extends PartialType(CreatePaymentDto) {}
