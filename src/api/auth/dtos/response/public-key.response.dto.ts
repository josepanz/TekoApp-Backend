import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Respuesta de `GET /auth/public-key`: la clave pública RSA (PEM) que el cliente usa para cifrar
 * `{password, nonce}` con OAEP-SHA256 antes de `POST /auth/login` (ver
 * `common/helpers/crypto-helpers.ts#decrypt`). Es la misma clave que `JwtStrategy` usa para
 * verificar la firma de los JWT (`authentication.publicKey`) — exponerla no compromete nada
 * (es, por definición, la mitad pública del par), solo evita que cada cliente sin servidor propio
 * (mobile) tenga que llevarla hardcodeada y resincronizarla a mano si el backend rota la clave.
 */
export class PublicKeyResponseDTO {
  @ApiProperty({
    example:
      '-----BEGIN PUBLIC KEY-----\nMIIBIjAN...\n-----END PUBLIC KEY-----',
    description: 'Clave pública RSA en formato PEM.',
  })
  @IsString()
  publicKeyPem!: string;
}
