import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UnblockUserRequestDTO {
  @ApiProperty({
    example: 'Se validó identidad y se restableció acceso',
    description: 'Motivo del desbloqueo del usuario',
  })
  @IsString({
    message: i18nValidationMessage('validation.UNBLOCK_REASON_MUST_BE_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.UNBLOCK_REASON_REQUIRED'),
  })
  reason!: string;
}
