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

  async applyTransaction(data: {
    promotionId: string;
    userId: number;
    serviceId?: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.extended.$transaction([
      this.prisma.extended.promotionUsage.create({
        data: {
          promotionId: data.promotionId,
          userId: data.userId,
          serviceId: data.serviceId,
          originalAmount: data.originalAmount,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
          metadata: data.metadata,
        },
      }),
      this.prisma.extended.promotion.update({
        where: { id: data.promotionId },
        data: { currentUsage: { increment: 1 } },
      }),
    ]);
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
