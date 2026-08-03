import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class VerificationStatusQueryDTO {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario a verificar.',
  })
  @IsEmail(
    {},
    { message: i18nValidationMessage('validation.EMAIL_INVALID_FORMAT') },
  )
  email!: string;
}
