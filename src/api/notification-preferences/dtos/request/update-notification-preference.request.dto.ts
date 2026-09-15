import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';

export class UpdateNotificationPreferenceRequestDTO {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.PROMOTION,
    description: 'Tipo de notificación cuya preferencia se está cambiando.',
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({
    example: false,
    description:
      'true = el usuario quiere seguir recibiendo este tipo; false = lo desactivó. Se guarda ' +
      'por switch (auto-save), no hace falta mandar el resto de las preferencias.',
  })
  @IsBoolean()
  enabled!: boolean;
}
