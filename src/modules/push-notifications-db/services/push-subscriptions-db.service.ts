import { Injectable, Logger } from '@nestjs/common';
import { PushSubscriptions } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { ICreatePushSubscriptionData } from '../interfaces/push-notifications-db.interface';

@Injectable()
export class PushSubscriptionsDbService {
  private readonly logger = new Logger(PushSubscriptionsDbService.name);

  constructor(private readonly prisma: PrismaDatasource) {}

  async upsertByEndpoint(
    data: ICreatePushSubscriptionData,
  ): Promise<PushSubscriptions> {
    return await this.prisma.extended.pushSubscriptions.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: data.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent,
        createdBy: data.createdBy,
      },
      update: {
        userId: data.userId,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent,
        isActive: true,
        lastChangedBy: data.createdBy,
        lastChangedAt: new Date(),
      },
    });
  }

  async findActiveByUserId(userId: number): Promise<PushSubscriptions[]> {
    return await this.prisma.extended.pushSubscriptions.findMany({
      where: { userId, isActive: true },
    });
  }

  async deleteByEndpoint(endpoint: string, userId: number): Promise<void> {
    await this.prisma.extended.pushSubscriptions.deleteMany({
      where: { endpoint, userId },
    });
  }

  async deleteByReferenceId(
    referenceId: string,
    userId: number,
  ): Promise<void> {
    await this.prisma.extended.pushSubscriptions.deleteMany({
      where: { referenceId, userId },
    });
  }

  async deactivateByEndpoint(endpoint: string): Promise<void> {
    this.logger.warn(
      `Suscripción push expirada/revocada, desactivando: ${endpoint}`,
    );
    await this.prisma.extended.pushSubscriptions.updateMany({
      where: { endpoint },
      data: {
        isActive: false,
        changedReason:
          'Endpoint reportó 404/410 al enviar (revocada por el navegador/usuario)',
      },
    });
  }
}
