import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentMethodIdParamDTO {
  @ApiProperty({
    description: 'ID UUID del método de pago',
    example: 'a63b5212-db5e-4ef5-9614-726614174000',
  })
  @IsUUID('4')
  id!: string;
}
