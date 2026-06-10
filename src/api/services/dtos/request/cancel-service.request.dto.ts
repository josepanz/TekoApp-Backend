import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelServiceRequestDTO {
  @ApiProperty({
    description: 'Motivo de la cancelación',
    example: 'El cliente canceló la solicitud',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
