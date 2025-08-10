import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion, PromotionStatus, PromotionType } from './entities/promotion.entity';
import { PromotionUsage } from './entities/promotion-usage.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ApplyPromotionDto } from './dto/apply-promotion.dto';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(PromotionUsage)
    private readonly promotionUsageRepository: Repository<PromotionUsage>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto, createdById: string): Promise<Promotion> {
    // Verificar que el código sea único
    const existingPromotion = await this.promotionRepository.findOne({
      where: { code: createPromotionDto.code }
    });

    if (existingPromotion) {
      throw new BadRequestException('El código de promoción ya existe');
    }

    const promotion = this.promotionRepository.create({
      ...createPromotionDto,
      validFrom: new Date(createPromotionDto.validFrom),
      validUntil: new Date(createPromotionDto.validUntil),
      createdById,
      status: PromotionStatus.ACTIVE,
    });

    return this.promotionRepository.save(promotion);
  }

  async findAll(): Promise<Promotion[]> {
    return this.promotionRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findActive(): Promise<Promotion[]> {
    return this.promotionRepository
      .createQueryBuilder('promotion')
      .where('promotion.status = :status', { status: PromotionStatus.ACTIVE })
      .andWhere('promotion.validFrom <= :now', { now: new Date() })
      .andWhere('promotion.validUntil >= :now', { now: new Date() })
      .andWhere('(promotion.maxUsage = -1 OR promotion.currentUsage < promotion.maxUsage)')
      .getMany();
  }

  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: ['usages']
    });

    if (!promotion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    return promotion;
  }

  async findByCode(code: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { code }
    });

    if (!promotion) {
      throw new NotFoundException('Código de promoción no válido');
    }

    return promotion;
  }

  async update(id: string, updatePromotionDto: Partial<CreatePromotionDto>): Promise<Promotion> {
    const promotion = await this.findOne(id);
    
    Object.assign(promotion, updatePromotionDto);
    
    if (updatePromotionDto.validFrom) {
      promotion.validFrom = new Date(updatePromotionDto.validFrom);
    }
    if (updatePromotionDto.validUntil) {
      promotion.validUntil = new Date(updatePromotionDto.validUntil);
    }

    return this.promotionRepository.save(promotion);
  }

  async remove(id: string): Promise<void> {
    const promotion = await this.findOne(id);
    await this.promotionRepository.remove(promotion);
  }

  async validatePromotion(code: string, userId: string, userType: string, serviceAmount: number): Promise<{
    isValid: boolean;
    promotion?: Promotion;
    discountAmount: number;
    message?: string;
  }> {
    try {
      const promotion = await this.findByCode(code);
      
      // Verificar si está activa
      if (!promotion.isActive()) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'La promoción no está activa o ha expirado'
        };
      }

      // Verificar si el usuario puede usar esta promoción
      if (!promotion.canBeUsedByUser(userId, userType)) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Esta promoción no está disponible para tu tipo de usuario'
        };
      }

      // Verificar si el usuario ya usó esta promoción el máximo de veces permitido
      const userUsageCount = await this.promotionUsageRepository.count({
        where: { promotionId: promotion.id, userId }
      });

      if (userUsageCount >= promotion.maxUsagePerUser) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Ya has usado esta promoción el máximo de veces permitido'
        };
      }

      // Verificar monto mínimo
      if (promotion.minimumAmount && serviceAmount < promotion.minimumAmount) {
        return {
          isValid: false,
          discountAmount: 0,
          message: `El monto mínimo para usar esta promoción es $${promotion.minimumAmount}`
        };
      }

      // Calcular descuento
      const discountAmount = promotion.calculateDiscount(serviceAmount);

      return {
        isValid: true,
        promotion,
        discountAmount
      };
    } catch (error) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Código de promoción no válido'
      };
    }
  }

  async applyPromotion(applyPromotionDto: ApplyPromotionDto): Promise<{
    success: boolean;
    discountAmount: number;
    finalAmount: number;
    promotion?: Promotion;
    message?: string;
  }> {
    const { promotionCode, serviceId, serviceAmount, userId, userType } = applyPromotionDto;

    const validation = await this.validatePromotion(
      promotionCode,
      userId,
      userType,
      serviceAmount
    );

    if (!validation.isValid) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: serviceAmount,
        message: validation.message
      };
    }

    const promotion = validation.promotion;
    const discountAmount = validation.discountAmount;
    const finalAmount = serviceAmount - discountAmount;

    // Registrar el uso de la promoción
    const promotionUsage = this.promotionUsageRepository.create({
      promotionId: promotion.id,
      userId,
      originalAmount: serviceAmount,
      discountAmount,
      finalAmount,
      metadata: { serviceId }
    });

    await this.promotionUsageRepository.save(promotionUsage);

    // Incrementar el contador de uso
    promotion.currentUsage += 1;
    await this.promotionRepository.save(promotion);

    this.logger.log(`Promoción ${promotion.code} aplicada exitosamente. Descuento: $${discountAmount}`);

    return {
      success: true,
      discountAmount,
      finalAmount,
      promotion,
      message: `Promoción aplicada exitosamente. Descuento: $${discountAmount}`
    };
  }

  async getPromotionStats(): Promise<{
    totalPromotions: number;
    activePromotions: number;
    totalUsage: number;
    totalDiscount: number;
  }> {
    const [totalPromotions, activePromotions, totalUsage, totalDiscount] = await Promise.all([
      this.promotionRepository.count(),
      this.promotionRepository.count({ where: { status: PromotionStatus.ACTIVE } }),
      this.promotionUsageRepository.count(),
      this.promotionUsageRepository
        .createQueryBuilder('usage')
        .select('SUM(usage.discountAmount)', 'total')
        .getRawOne()
        .then(result => parseFloat(result.total) || 0)
    ]);

    return {
      totalPromotions,
      activePromotions,
      totalUsage,
      totalDiscount
    };
  }
}
