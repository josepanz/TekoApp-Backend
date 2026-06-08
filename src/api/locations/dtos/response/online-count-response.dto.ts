import { ApiProperty } from '@nestjs/swagger';

export class OnlineCountResponseDTO {
  @ApiProperty({
    description: 'Cantidad total consolidada de profesionales activos en línea',
    example: 42,
  })
  count!: number;
}
