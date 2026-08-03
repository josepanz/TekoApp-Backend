import { Injectable } from '@nestjs/common';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { UserCredentials } from '@prisma/client';

@Injectable()
export class CredentialsRepository {
  constructor(private readonly prisma: PrismaDatasource) {}

  /**
   * Busca la credencial activa más reciente de un usuario.
   */
  async findByUserId(userId: number): Promise<UserCredentials | null> {
    return await this.prisma.extended.userCredentials.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Devuelve las últimas `limit` credenciales del usuario (activas + inactivas),
   * ordenadas de la más reciente a la más antigua. Se usa para validar el reuso
   * de contraseñas contra el histórico.
   */
  async findRecentByUserId(
    userId: number,
    limit: number,
  ): Promise<UserCredentials[]> {
    return await this.prisma.extended.userCredentials.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Rota la contraseña de un usuario manteniendo el histórico:
   * desactiva TODAS las credenciales activas actuales (`updateMany`, patrón
   * TOCTOU-safe) e inserta una nueva fila activa con la contraseña nueva. Todo
   * dentro de una única transacción para que login/consultas siempre encuentren
   * exactamente una credencial activa.
   *
   * `expiredAt` de la nueva fila se recibe ya calculado por el servicio (a partir
   * de `PASSWORD_EXPIRATION_DAYS`): `null` = expiración indefinida (default), lo
   * que además "limpia" cualquier expiración previa; una fecha = expira en ese
   * instante.
   */
  async rotatePassword(
    userId: number,
    passwordHash: string,
    expiredAt: Date | null = null,
  ): Promise<UserCredentials> {
    return await this.prisma.extended.$transaction(async (tx) => {
      await tx.userCredentials.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      return await tx.userCredentials.create({
        data: {
          userId,
          passwordHash,
          attempts: 0,
          isActive: true,
          expiredAt,
        },
      });
    });
  }

  /**
   * Crea nuevas credenciales
   */
  async create(data: {
    userId: number;
    passwordHash: string;
    attempts?: number;
    isActive?: boolean;
  }): Promise<UserCredentials> {
    return await this.prisma.extended.userCredentials.create({
      data: {
        userId: data.userId,
        passwordHash: data.passwordHash,
        attempts: data.attempts ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Actualiza credenciales
   */
  async update(
    id: number,
    data: {
      passwordHash?: string;
      attempts?: number;
      isActive?: boolean;
    },
  ): Promise<UserCredentials> {
    return await this.prisma.extended.userCredentials.update({
      where: { id },
      data,
    });
  }

  /**
   * Actualiza solo los intentos
   */
  async updateAttempts(id: number, attempts: number): Promise<void> {
    await this.prisma.extended.userCredentials.update({
      where: { id },
      data: { attempts },
    });
  }
}
