import { PaymentStatus } from '@prisma/client';

export class PaymentQueryDto {
  userId?: string;
  professionalId?: string;
  status?: PaymentStatus;
}
