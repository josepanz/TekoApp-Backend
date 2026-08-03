import { Injectable, Logger } from '@nestjs/common';
import { FcmTokens } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { ICreateFcmTokenData } from '../interfaces/push-notifications-db.interface';

@Injectable()
export class FcmTokensDbService {
  private readonly logger = new Logger(FcmTokensDbService.name);

  constructor(private readonly prisma: PrismaDatasource) {}

  async upsertByToken(data: ICreateFcmTokenData): Promise<FcmTokens> {
    return await this.prisma.extended.fcmTokens.upsert({
      where: { token: data.token },
      create: {
        userId: data.userId,
        token: data.token,
        deviceType: data.deviceType,
        createdBy: data.createdBy,
      },
      update: {
        userId: data.userId,
        deviceType: data.deviceType,
        isActive: true,
        lastChangedBy: data.createdBy,
        lastChangedAt: new Date(),
      },
    });
  }

  async findActiveByUserId(userId: number): Promise<FcmTokens[]> {
    return await this.prisma.extended.fcmTokens.findMany({
      where: { userId, isActive: true },
    });
  }

  async deleteByToken(token: string, userId: number): Promise<void> {
    await this.prisma.extended.fcmTokens.deleteMany({
      where: { token, userId },
    });
  }

  async deleteByReferenceId(
    referenceId: string,
    userId: number,
  ): Promise<void> {
    await this.prisma.extended.fcmTokens.deleteMany({
      where: { referenceId, userId },
    });
  }

  async deactivateByToken(token: string): Promise<void> {
    this.logger.warn(
      `Token FCM inválido/no registrado, desactivando: ${token.slice(0, 12)}...`,
    );
    await this.prisma.extended.fcmTokens.updateMany({
      where: { token },
      data: {
        isActive: false,
        changedReason:
          'Token reportó messaging/registration-token-not-registered al enviar',
      },
    });
  }
}
