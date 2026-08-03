import { ApiProperty } from '@nestjs/swagger';

export class PushSubscriptionResponseDTO {
  @ApiProperty({
    description: 'Identificador público de la suscripción',
    example: 'a3f1e9b2-4c3d-4e5f-8a9b-1c2d3e4f5a6b',
  })
  readonly referenceId!: string;

  @ApiProperty({
    description: 'Endpoint del navegador registrado',
    example: 'https://fcm.googleapis.com/fcm/send/abc123',
  })
  readonly endpoint!: string;

  @ApiProperty({ description: 'Fecha de creación de la suscripción' })
  readonly createdAt!: Date;
}
