import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PushSubscriptionReferenceIdParamDTO {
  @ApiProperty({
    description: 'Identificador público de la suscripción Web Push',
    example: 'a3f1e9b2-4c3d-4e5f-8a9b-1c2d3e4f5a6b',
  })
  @IsUUID()
  readonly referenceId!: string;
}
