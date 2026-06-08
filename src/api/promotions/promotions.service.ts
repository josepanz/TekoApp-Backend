import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  Promotion,
  Prisma,
  PromotionStatus,
  PromotionType,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(private readonly prisma: PrismaDatasource) {}

  async create(dto: Prisma.PromotionUncheckedCreateInput, createdById: number) {
    const existing = await this.prisma.extended.promotion.findUnique({
      where: { code: dto.code },
    });
    if (existing)
      throw new BadRequestException('El código de promoción ya existe');

    return this.prisma.extended.promotion.create({
      data: { ...dto, createdById, status: PromotionStatus.ACTIVE },
    });
  }

  async findAll() {
    return this.prisma.extended.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.extended.promotion
      .findMany({
        where: {
          status: PromotionStatus.ACTIVE,
          validFrom: { lte: now },
          validUntil: { gte: now },
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
          .findMany({
            where: {
              status: PromotionStatus.ACTIVE,
              validFrom: { lte: now },
              validUntil: { gte: now },
            },
          })
          .then((all) =>
            all.filter((p) => p.maxUsage === -1 || p.currentUsage < p.maxUsage),
          ),
      );
  }

  async findOne(id: string) {
    const promotion = await this.prisma.extended.promotion.findUnique({
      where: { id },
      include: { usages: true },
    });
    if (!promotion) throw new NotFoundException('Promoción no encontrada');
    return promotion;
  }

  async findByCode(code: string) {
    const promotion = await this.prisma.extended.promotion.findUnique({
      where: { code },
    });
    if (!promotion)
      throw new NotFoundException('Código de promoción no válido');
    return promotion;
  }

  async update(id: string, dto: Prisma.PromotionUpdateInput) {
    await this.findOne(id);
    return this.prisma.extended.promotion.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.extended.promotion.update({
      where: { id },
      data: { status: PromotionStatus.INACTIVE },
    });
  }

  async validatePromotion(
    code: string,
    userId: number,
    userType: string,
    serviceAmount: number,
  ): Promise<{
    isValid: boolean;
    promotion?: Promotion;
    discountAmount: number;
    message?: string;
  }> {
    try {
      const promotion = await this.findByCode(code);
      const now = new Date();

      if (
        promotion.status !== PromotionStatus.ACTIVE ||
        promotion.validFrom > now ||
        promotion.validUntil < now ||
        (promotion.maxUsage !== -1 &&
          promotion.currentUsage >= promotion.maxUsage)
      ) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'La promoción no está activa o ha expirado',
        };
      }

      if (
        (promotion.allowedUserTypes.length > 0 &&
          !promotion.allowedUserTypes.includes(userType)) ||
        (promotion.specificUserIds.length > 0 &&
          !promotion.specificUserIds.includes(userId))
      ) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Esta promoción no está disponible para tu tipo de usuario',
        };
      }

      const usageCount = await this.prisma.extended.promotionUsage.count({
        where: { promotionId: promotion.id, userId },
      });
      if (usageCount >= promotion.maxUsagePerUser) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Ya has usado esta promoción el máximo de veces permitido',
        };
      }

      const minAmount = promotion.minimumAmount
        ? Number(promotion.minimumAmount)
        : 0;
      if (minAmount > 0 && serviceAmount < minAmount) {
        return {
          isValid: false,
          discountAmount: 0,
          message: `El monto mínimo para usar esta promoción es ${minAmount}`,
        };
      }

      const discountAmount = this.calculateDiscount(promotion, serviceAmount);
      return { isValid: true, promotion, discountAmount };
    } catch {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Código de promoción no válido',
      };
    }
  }

  async applyPromotion(dto: {
    promotionCode: string;
    serviceId?: string;
    serviceAmount: number;
    userId: number;
    userType: string;
  }) {
    const { promotionCode, serviceId, serviceAmount, userId, userType } = dto;
    const validation = await this.validatePromotion(
      promotionCode,
      userId,
      userType,
      serviceAmount,
    );

    if (!validation.isValid || !validation.promotion) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: serviceAmount,
        message: validation.message,
      };
    }

    const { promotion, discountAmount } = validation;
    const finalAmount = serviceAmount - discountAmount;

    await this.prisma.extended.$transaction([
      this.prisma.extended.promotionUsage.create({
        data: {
          promotionId: promotion.id,
          userId,
          serviceId,
          originalAmount: serviceAmount,
          discountAmount,
          finalAmount,
          metadata: serviceId ? { serviceId } : undefined,
        },
      }),
      this.prisma.extended.promotion.update({
        where: { id: promotion.id },
        data: { currentUsage: { increment: 1 } },
      }),
    ]);

    this.logger.log(
      `Promoción ${promotion.code} aplicada. Descuento: ${discountAmount}`,
    );
    return {
      success: true,
      discountAmount,
      finalAmount,
      promotion,
      message: `Promoción aplicada. Descuento: ${discountAmount}`,
    };
  }

  async getPromotionStats() {
    const now = new Date();
    const [totalPromotions, activePromotions, usageAgg] = await Promise.all([
      this.prisma.extended.promotion.count(),
      this.prisma.extended.promotion.count({
        where: {
          status: PromotionStatus.ACTIVE,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
      }),
      this.prisma.extended.promotionUsage.aggregate({
        _count: { id: true },
        _sum: { discountAmount: true },
      }),
    ]);

    return {
      totalPromotions,
      activePromotions,
      totalUsage: usageAgg._count.id,
      totalDiscount: Number(usageAgg._sum.discountAmount ?? 0),
    };
  }

  private calculateDiscount(
    promotion: {
      type: PromotionType;
      discountPercentage: Prisma.Decimal | null;
      discountAmount: Prisma.Decimal | null;
      maximumDiscount: Prisma.Decimal | null;
    },
    amount: number,
  ): number {
    if (promotion.type === PromotionType.FIXED_AMOUNT) {
      return Math.min(Number(promotion.discountAmount ?? 0), amount);
    }
    if (promotion.type === PromotionType.FREE_SERVICE) {
      return amount;
    }
    const pct = Number(promotion.discountPercentage ?? 0);
    let discount = (amount * pct) / 100;
    if (promotion.maximumDiscount) {
      discount = Math.min(discount, Number(promotion.maximumDiscount));
    }
    return Math.round(discount * 100) / 100;
  }
}
