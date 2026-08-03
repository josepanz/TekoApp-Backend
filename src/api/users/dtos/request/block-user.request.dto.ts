import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class BlockUserRequestDTO {
  @ApiProperty({
    example: 'Se detectaron intentos de acceso sospechosos',
    description: 'Motivo del bloqueo del usuario',
  })
  @IsString({
    message: i18nValidationMessage('validation.BLOCK_REASON_MUST_BE_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.BLOCK_REASON_REQUIRED'),
  })
  reason!: string;
}
