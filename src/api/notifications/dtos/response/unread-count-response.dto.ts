import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponseDTO {
  @ApiProperty({
    description: 'Cantidad consolidada de notificaciones pendientes de lectura',
    example: 5,
  })
  readonly count!: number;
}
