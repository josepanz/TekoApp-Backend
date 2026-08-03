import { ApiProperty } from '@nestjs/swagger';

export class VapidPublicKeyResponseDTO {
  @ApiProperty({
    description:
      'Clave pública VAPID — la usa el frontend en pushManager.subscribe({ applicationServerKey })',
    example:
      'BOZRpAjqLURvFBkW-7jiWpzFRiOULwH-MZ-6zBNw5g5-pTKrDbSZHzCfetZ-qFXTqsWz6FosItuxzdwIN0TY6q4',
  })
  readonly publicKey!: string;
}
