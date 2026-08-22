import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetOnlineStatusRequestDTO {
  @ApiProperty({
    description: 'Nuevo estado online del profesional autenticado',
    example: true,
  })
  @IsBoolean()
  readonly isOnline!: boolean;
}
