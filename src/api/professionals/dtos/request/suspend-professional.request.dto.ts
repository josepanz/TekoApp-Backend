import { IsNotEmpty, IsString } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SuspendProfessionalRequestDTO {
  @ApiProperty({
    description: 'Motivo de la suspensión',
    example: 'Conducta inapropiada reportada',
  })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
