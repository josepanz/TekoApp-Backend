import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';
import { NotificationStatus } from '@modules/notifications-db/enums/notification-status.enum';

export class NotificationResponseDTO {
  @ApiProperty({
    description: 'ID de la notificación',
    example: '6481fc923fbc4a3a6c23e801',
  })
  readonly id!: string;

  @ApiProperty({
    description: 'ID del usuario destino',
    example: '6481fc923fbc4a3a6c23e802',
  })
  readonly userId!: string;

  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Pago Recibido',
  })
  readonly title!: string;

  @ApiProperty({
    description: 'Mensaje de la notificación',
    example: 'Tu pago ha sido procesado exitosamente.',
  })
  readonly message!: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.PAYMENT_RECEIVED,
  })
  readonly type!: NotificationType;

  @ApiProperty({ enum: NotificationStatus, example: NotificationStatus.READ })
  readonly status!: NotificationStatus;

  @ApiProperty({ description: 'Canales asignados', example: ['in_app'] })
  readonly channels!: string[];

  @ApiPropertyOptional({ description: 'Payload con datos extras' })
  readonly data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Fecha de lectura',
    example: '2026-06-07T22:30:00.000Z',
  })
  readonly readAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Fecha de envío',
    example: '2026-06-07T22:25:00.000Z',
  })
  readonly sentAt?: Date | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2026-06-07T22:24:00.000Z',
  })
  readonly createdAt!: Date;
}
