import { Injectable } from '@nestjs/common';
import { NotificationPreferences, Prisma } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class NotificationPreferencesDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findByUserId(userId: number): Promise<NotificationPreferences | null> {
    return this.prisma.extended.notificationPreferences.findUnique({
      where: { userId },
    });
  }

  /**
   * Crea o actualiza la fila del usuario con el array completo de tipos silenciados. `upsert`
   * porque la fila se crea perezosamente en el primer cambio que hace el usuario — no en el
   * alta de `Users` (ver el comentario del modelo en `schema.prisma`).
   */
  async upsertMutedTypes(
    userId: number,
    mutedTypes: string[],
  ): Promise<NotificationPreferences> {
    const create: Prisma.NotificationPreferencesUncheckedCreateInput = {
      userId,
      mutedTypes,
      createdBy: String(userId),
    };
    const update: Prisma.NotificationPreferencesUncheckedUpdateInput = {
      mutedTypes,
      lastChangedBy: String(userId),
    };

    return this.prisma.extended.notificationPreferences.upsert({
      where: { userId },
      create,
      update,
    });
  }
}
