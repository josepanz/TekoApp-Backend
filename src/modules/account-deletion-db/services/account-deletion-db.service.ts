import { Injectable } from '@nestjs/common';
import { Prisma, ProfessionalStatus, UserStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

const userDueForAnonymizationInclude = {
  professionals: { include: { professionalDocuments: true } },
} satisfies Prisma.UsersInclude;

export type UserDueForAnonymization = Prisma.UsersGetPayload<{
  include: typeof userDueForAnonymizationInclude;
}>;

@Injectable()
export class AccountDeletionDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  /**
   * Solo escribe si el usuario sigue `ACTIVE` — evita pisar un estado que cambió entre la
   * verificación de bloqueantes y esta escritura (ver `.claude/rules/typescript.md`, convención
   * de `updateMany` condicional).
   */
  async requestDeletion(
    userId: number,
    requestedAt: Date,
    scheduledAt: Date,
  ): Promise<number> {
    const result = await this.prisma.extended.users.updateMany({
      where: { id: userId, status: UserStatus.ACTIVE },
      data: {
        status: UserStatus.PENDING_DELETION,
        deletionRequestedAt: requestedAt,
        deletionScheduledAt: scheduledAt,
      },
    });
    return result.count;
  }

  /** Solo escribe si el usuario sigue `PENDING_DELETION` — mismo criterio que `requestDeletion`. */
  async cancelDeletion(userId: number): Promise<number> {
    const result = await this.prisma.extended.users.updateMany({
      where: { id: userId, status: UserStatus.PENDING_DELETION },
      data: {
        status: UserStatus.ACTIVE,
        deletionRequestedAt: null,
        deletionScheduledAt: null,
      },
    });
    return result.count;
  }

  async findDueForAnonymization(): Promise<UserDueForAnonymization[]> {
    return this.prisma.extended.users.findMany({
      where: {
        status: UserStatus.PENDING_DELETION,
        deletionScheduledAt: { lte: new Date() },
      },
      include: userDueForAnonymizationInclude,
    });
  }

  /**
   * Anonimiza una cuenta vencida en una sola transacción (Users + Professionals +
   * ProfessionalDocuments + PushSubscriptions + FcmTokens). Cruza varias tablas que en el resto
   * del repo cada una vive en su propio módulo `-db` — acá se hace directo porque es una
   * operación atómica única de este feature, no una consulta de rutina de otro dominio (partir
   * la transacción entre servicios distintos no es practicable con Prisma).
   *
   * Devuelve `null` si el usuario ya no está `PENDING_DELETION` (se canceló entre el barrido y
   * esta llamada) — en ese caso el caller NO debe borrar ningún objeto de S3. Si devuelve un
   * array (posiblemente vacío), la anonimización sí se aplicó y esas son las keys a borrar.
   */
  async anonymizeUser(user: UserDueForAnonymization): Promise<string[] | null> {
    const professional = user.professionals;
    const s3KeysToDelete: string[] = [];
    if (user.avatarKey) s3KeysToDelete.push(user.avatarKey);
    if (professional) {
      for (const document of professional.professionalDocuments) {
        if (document.fileKey) s3KeysToDelete.push(document.fileKey);
      }
    }

    const applied = await this.prisma.extended.$transaction(async (tx) => {
      const updated = await tx.users.updateMany({
        where: { id: user.id, status: UserStatus.PENDING_DELETION },
        data: {
          email: `deleted-user-${user.id}@deleted.tekoapp.internal`,
          firstName: 'Usuario',
          lastName: 'eliminado',
          documentNumber: null,
          phoneNumber: null,
          unverifiedEmail: null,
          avatarKey: null,
          status: UserStatus.DELETED,
        },
      });
      if (updated.count === 0) return false;

      if (professional) {
        await tx.professionals.update({
          where: { id: professional.id },
          data: { status: ProfessionalStatus.SUSPENDED, isActive: false },
        });
        await tx.professionalDocuments.updateMany({
          where: { professionalId: professional.id },
          data: { fileKey: null },
        });
      }

      await tx.pushSubscriptions.deleteMany({ where: { userId: user.id } });
      await tx.fcmTokens.deleteMany({ where: { userId: user.id } });

      return true;
    });

    return applied ? s3KeysToDelete : null;
  }
}
