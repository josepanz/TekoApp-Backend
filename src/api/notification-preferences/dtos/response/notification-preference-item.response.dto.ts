import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';

export class NotificationPreferenceItemResponseDTO {
  @ApiProperty({ enum: NotificationType, example: NotificationType.PROMOTION })
  type!: NotificationType;

  @ApiProperty({
    example: true,
    description: 'false si el usuario desactivó explícitamente este tipo.',
  })
  enabled!: boolean;
}
