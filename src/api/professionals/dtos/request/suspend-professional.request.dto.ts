import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuspendProfessionalRequestDTO {
  @ApiProperty({
    description: 'Motivo de la suspensión',
    example: 'Conducta inapropiada reportada',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
