import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PushSubscriptionKeysDTO {
  @ApiProperty({
    description: 'Clave pública P-256 de la suscripción (cifrado del payload)',
    example:
      'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
  })
  @IsString()
  @IsNotEmpty()
  readonly p256dh!: string;

  @ApiProperty({
    description: 'Secreto de autenticación de la suscripción',
    example: 'tBHItJI5svbpez7KI4CCXg',
  })
  @IsString()
  @IsNotEmpty()
  readonly auth!: string;
}

/**
 * Forma exacta de `PushSubscription.toJSON()` del navegador (Web Push estándar) —
 * el frontend manda este objeto tal cual lo devuelve `pushManager.subscribe()`.
 */
export class CreatePushSubscriptionRequestDTO {
  @ApiProperty({
    description:
      'URL única del endpoint del navegador para este dispositivo/sesión',
    example: 'https://fcm.googleapis.com/fcm/send/abc123',
  })
  @IsUrl()
  readonly endpoint!: string;

  @ApiProperty({
    description: 'Claves de cifrado de la suscripción',
    type: PushSubscriptionKeysDTO,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDTO)
  readonly keys!: PushSubscriptionKeysDTO;

  @ApiPropertyOptional({
    description:
      'User-Agent del navegador al momento de suscribirse (informativo, para soporte)',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  readonly userAgent?: string;
}
