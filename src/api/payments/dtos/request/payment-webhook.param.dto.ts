import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentProvider } from '@prisma/client';

export class PaymentWebhookParamDTO {
  @ApiProperty({
    description: 'Proveedor del webhook de pago',
    enum: PaymentProvider,
  })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;
}
