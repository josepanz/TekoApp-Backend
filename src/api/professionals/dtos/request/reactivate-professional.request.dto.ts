import { IsNotEmpty, IsString } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReactivateProfessionalRequestDTO {
  @ApiProperty({
    description:
      'Motivo de la reactivación (obligatorio, queda en la auditoría)',
    example: 'Apelación aceptada tras revisar el caso',
  })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
