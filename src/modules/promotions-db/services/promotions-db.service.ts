import { Injectable } from '@nestjs/common';
import { Prisma, PromotionStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class PromotionsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findByCode(code: string) {
    return this.prisma.extended.promotion.findUnique({ where: { code } });
  }

  async create(data: Prisma.PromotionUncheckedCreateInput) {
    return this.prisma.extended.promotion.create({ data });
  }

  async findAll() {
    return this.prisma.extended.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    const now = new Date();
    const baseWhere: Prisma.PromotionWhereInput = {
      status: PromotionStatus.ACTIVE,
      validFrom: { lte: now },
      validUntil: { gte: now },
    };

    return this.prisma.extended.promotion
      .findMany({
        where: {
          ...baseWhere,
          OR: [
            { maxUsage: -1 },
            {
              currentUsage: {
                lt: this.prisma.extended.promotion.fields?.maxUsage as never,
              },
            },
          ],
        },
      })
      .catch(() =>
        this.prisma.extended.promotion
          .findMany({ where: baseWhere })
          .then((all) =>
            all.filter((p) => p.maxUsage === -1 || p.currentUsage < p.maxUsage),
          ),
      );
  }

  async findById(id: string) {
    return this.prisma.extended.promotion.findUnique({
      where: { id },
      include: { usages: true },
    });
  }

  async update(id: string, data: Prisma.PromotionUpdateInput) {
    return this.prisma.extended.promotion.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    return this.prisma.extended.promotion.update({
      where: { id },
      data: { status: PromotionStatus.INACTIVE },
    });
  }

  async countUsageByUser(promotionId: string, userId: number) {
    return this.prisma.extended.promotionUsage.count({
      where: { promotionId, userId },
    });
  }

  /**
   * Aplica la promoción de forma atómica: el `UPDATE ... WHERE (max_usage = -1 OR current_usage
   * < max_usage)` es la guarda contra la carrera — sin esto, dos aplicaciones concurrentes
   * pueden leer el mismo `currentUsage` antes de que ninguna escriba (vía `validatePromotion`) y
   * ambas pasar la validación, excediendo `maxUsage`. El UPDATE toma el lock de fila al escribir,
   * así que el WHERE se re-evalúa contra el valor más reciente incluso bajo concurrencia — no
   * hace falta un `SELECT FOR UPDATE` separado. Devuelve `false` si ya no había cupo (el caller
   * no debe crear el registro de uso ni cobrar el descuento en ese caso).
   *
   * Gap conocido, no resuelto acá: el límite POR USUARIO (`maxUsagePerUser`) se sigue validando
   * con una lectura previa no atómica (`countUsageByUser` en el service) — dos aplicaciones
   * concurrentes del mismo usuario podrían igual exceder su propio límite individual. Resolverlo
   * de forma general requeriría una constraint/lock adicional; el límite GLOBAL (el caso que
   * reportó la auditoría) es el que se corrige acá.
   */
  async applyTransaction(data: {
    promotionId: string;
    userId: number;
    serviceId?: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    metadata?: Record<string, unknown>;
  }): Promise<boolean> {
    return this.prisma.extended.$transaction(async (tx) => {
      const incremented = await tx.$queryRaw<{ id: string }[]>`
        UPDATE promotions
        SET current_usage = current_usage + 1
        WHERE id = ${data.promotionId}::uuid
          AND (max_usage = -1 OR current_usage < max_usage)
        RETURNING id
      `;
      if (incremented.length === 0) {
        return false;
      }

      await tx.promotionUsage.create({
        data: {
          promotionId: data.promotionId,
          userId: data.userId,
          serviceId: data.serviceId,
          originalAmount: data.originalAmount,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
          metadata: data.metadata,
        },
      });
      return true;
    });
  }

  async countPromotions(where?: Prisma.PromotionWhereInput) {
    return this.prisma.extended.promotion.count({ where });
  }

  async aggregateUsage() {
    return this.prisma.extended.promotionUsage.aggregate({
      _count: { id: true },
      _sum: { discountAmount: true },
    });
  }
}
