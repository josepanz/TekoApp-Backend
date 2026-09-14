import { ApiProperty } from '@nestjs/swagger';
import { NotificationPreferenceItemResponseDTO } from './notification-preference-item.response.dto';

export class NotificationPreferencesResponseDTO {
  @ApiProperty({
    type: [NotificationPreferenceItemResponseDTO],
    description:
      'Un ítem por cada valor de NotificationType — no solo los que el usuario desactivó, para ' +
      'que el frontend pueda pintar todos los switches sin tener que conocer el catálogo completo.',
  })
  preferences!: NotificationPreferenceItemResponseDTO[];
}
