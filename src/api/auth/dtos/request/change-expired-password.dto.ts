import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

/**
 * Cambio de contraseña cuando la anterior YA expiró (flujo pre-login, sin
 * sesión JWT). Misma forma que `UpdateUserPasswordDTO`: los valores viajan
 * cifrados con RSA; la validación de complejidad se aplica luego de
 * desencriptar, a nivel de servicio.
 */
export class ChangeExpiredPasswordDTO {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'oldPassword123',
    description: 'Contraseña actual (expirada) encriptada del usuario.',
    format: 'password',
  })
  @IsString()
  encryptedOldPassword!: string;

  @ApiProperty({
    example: 'newPassword456',
    description: 'Nueva contraseña encriptada del usuario.',
    format: 'password',
  })
  @IsString()
  encryptedNewPassword!: string;
}
