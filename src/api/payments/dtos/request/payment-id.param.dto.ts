import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentIdParamDTO {
  @ApiProperty({
    description: 'ID UUID del pago',
    example: 'a63b5212-db5e-4ef5-9614-726614174000',
  })
  @IsUUID('4')
  id!: string;
}
