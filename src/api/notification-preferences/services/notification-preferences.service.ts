import { Injectable } from '@nestjs/common';
import { NotificationPreferencesDbService } from '@modules/notification-preferences-db/services/notification-preferences-db.service';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';
import { UpdateNotificationPreferenceRequestDTO } from '../dtos/request';
import { NotificationPreferencesResponseDTO } from '../dtos/response';

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly db: NotificationPreferencesDbService) {}

  /** Set de tipos que el usuario desactivó explícitamente. Sin fila = sin exclusiones. */
  private async getMutedTypes(userId: number): Promise<Set<string>> {
    const row = await this.db.findByUserId(userId);
    const muted = Array.isArray(row?.mutedTypes) ? row.mutedTypes : [];
    return new Set(muted as string[]);
  }

  /**
   * Devuelve un ítem por cada valor de `NotificationType`, no solo los que el usuario
   * desactivó — así el frontend puede pintar todos los switches sin conocer el catálogo.
   */
  async getPreferences(
    userId: number,
  ): Promise<NotificationPreferencesResponseDTO> {
    const muted = await this.getMutedTypes(userId);
    return {
      preferences: Object.values(NotificationType).map((type) => ({
        type,
        enabled: !muted.has(type),
      })),
    };
  }

  async updatePreference(
    userId: number,
    dto: UpdateNotificationPreferenceRequestDTO,
  ): Promise<NotificationPreferencesResponseDTO> {
    const muted = await this.getMutedTypes(userId);
    if (dto.enabled) {
      muted.delete(dto.type);
    } else {
      muted.add(dto.type);
    }
    await this.db.upsertMutedTypes(userId, Array.from(muted));
    return this.getPreferences(userId);
  }

  /**
   * Reusado por los disparos de notificación de dominio (tarea 5, I-05) para no encolar/enviar
   * un tipo que el usuario desactivó explícitamente.
   */
  async isEnabled(userId: number, type: NotificationType): Promise<boolean> {
    const muted = await this.getMutedTypes(userId);
    return !muted.has(type);
  }
}
