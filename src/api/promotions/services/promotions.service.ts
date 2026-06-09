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
import { PromotionsDbService } from '@modules/promotions-db/services/promotions-db.service';
import { CreatePromotionRequestDTO } from '../dtos/request/create-promotion.request.dto';
import { PromotionDetailResponseDTO } from '../dtos/response/promotion-detail.response.dto';
import { PromotionValidateResponseDTO } from '../dtos/response/promotion-validate.response.dto';
import { PromotionApplyResponseDTO } from '../dtos/response/promotion-apply.response.dto';
import { PromotionStatsResponseDTO } from '../dtos/response/promotion-stats.response.dto';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(private readonly db: PromotionsDbService) {}

  async create(
    dto: Prisma.PromotionUncheckedCreateInput,
    createdById: number,
  ): Promise<PromotionDetailResponseDTO> {
    const existing = await this.db.findByCode(dto.code);
    if (existing)
      throw new BadRequestException('El código de promoción ya existe');

    return this.db.create({
      ...dto,
      createdById,
      status: PromotionStatus.ACTIVE,
    }) as unknown as Promise<PromotionDetailResponseDTO>;
  }

  async findAll(): Promise<PromotionDetailResponseDTO[]> {
    return this.db.findAll() as unknown as Promise<
      PromotionDetailResponseDTO[]
    >;
  }

  async findActive(): Promise<PromotionDetailResponseDTO[]> {
    return this.db.findActive() as unknown as Promise<
      PromotionDetailResponseDTO[]
    >;
  }

  async findOne(id: string): Promise<PromotionDetailResponseDTO> {
    const promotion = await this.db.findById(id);
    if (!promotion) throw new NotFoundException('Promoción no encontrada');
    return promotion as unknown as PromotionDetailResponseDTO;
  }

  async findByCode(code: string): Promise<Promotion> {
    const promotion = await this.db.findByCode(code);
    if (!promotion)
      throw new NotFoundException('Código de promoción no válido');
    return promotion;
  }

  async update(
    id: string,
    dto: Prisma.PromotionUpdateInput,
  ): Promise<PromotionDetailResponseDTO> {
    await this.findOne(id);
    return this.db.update(id, dto) as unknown as PromotionDetailResponseDTO;
  }

  async remove(id: string): Promise<PromotionDetailResponseDTO> {
    await this.findOne(id);
    return this.db.deactivate(id) as unknown as PromotionDetailResponseDTO;
  }

  async validatePromotion(
    code: string,
    userId: number,
    userType: string,
    serviceAmount: number,
  ): Promise<PromotionValidateResponseDTO> {
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

      const usageCount = await this.db.countUsageByUser(promotion.id, userId);
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
      return {
        isValid: true,
        promotion: promotion as unknown as PromotionDetailResponseDTO,
        discountAmount,
      };
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
  }): Promise<PromotionApplyResponseDTO> {
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

    await this.db.applyTransaction({
      promotionId: promotion.id,
      userId,
      serviceId,
      originalAmount: serviceAmount,
      discountAmount,
      finalAmount,
      metadata: serviceId ? { serviceId } : undefined,
    });

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

  async getPromotionStats(): Promise<PromotionStatsResponseDTO> {
    const now = new Date();
    const [totalPromotions, activePromotions, usageAgg] = await Promise.all([
      this.db.countPromotions(),
      this.db.countPromotions({
        status: PromotionStatus.ACTIVE,
        validFrom: { lte: now },
        validUntil: { gte: now },
      }),
      this.db.aggregateUsage(),
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

export type { CreatePromotionRequestDTO };
