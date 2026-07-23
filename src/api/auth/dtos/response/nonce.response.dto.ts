import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Respuesta del endpoint `POST /auth/nonce`: nonce anti-replay de uso único
 * que el frontend debe incluir dentro del payload cifrado del login.
 */
export class NonceResponseDTO {
  @ApiProperty({
    example: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    description: 'Nonce aleatorio (32 chars hex) con TTL corto y de uso único.',
  })
  @IsString()
  nonce!: string;
}
