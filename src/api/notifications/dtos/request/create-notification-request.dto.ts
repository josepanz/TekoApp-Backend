import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';

export class CreateNotificationRequestDTO {
  @ApiProperty({
    description: 'Título descriptivo de la notificación',
    example: 'Nueva solicitud de servicio',
  })
  @IsString()
  @IsNotEmpty()
  readonly title!: string;

  @ApiProperty({
    description: 'Cuerpo detallado del mensaje de la notificación',
    example: 'El cliente Juan Pérez ha solicitado un servicio de plomería.',
  })
  @IsString()
  @IsNotEmpty()
  readonly message!: string;

  @ApiProperty({
    description: 'Tipo o categoría de la notificación para segmentación',
    enum: NotificationType,
    example: NotificationType.SERVICE_REQUEST,
  })
  @IsEnum(NotificationType)
  readonly type!: NotificationType;

  @ApiPropertyOptional({
    description:
      'Objeto con datos dinámicos requeridos por el cliente (Payload útil)',
    example: {
      requestId: 'c52b5212-db5e-4ef5-9614-726614174000',
      price: 45000,
    },
  })
  @IsOptional()
  @IsObject()
  readonly data?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Canales específicos de distribución y despacho para la notificación',
    example: ['in_app', 'push', 'email'],
    default: ['in_app'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly channels?: string[];

  @ApiPropertyOptional({
    description: 'Metadatos adicionales de auditoría o traza técnica',
    example: { ip: '192.168.1.1', device: 'iOS' },
  })
  @IsOptional()
  @IsObject()
  readonly metadata?: Record<string, unknown>;
}
