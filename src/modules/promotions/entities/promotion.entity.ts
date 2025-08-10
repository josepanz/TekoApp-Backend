import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PromotionUsage } from './promotion-usage.entity';
import { User } from '../../users/entities/user.entity';

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SERVICE = 'free_service',
}

export enum PromotionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PromotionType,
    default: PromotionType.PERCENTAGE,
  })
  type: PromotionType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountValue: number; // Porcentaje o monto fijo

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumAmount: number; // Monto mínimo para aplicar la promoción

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumDiscount: number; // Descuento máximo permitido

  @Column({ type: 'int', default: -1 })
  maxUsage: number; // -1 = ilimitado

  @Column({ type: 'int', default: 0 })
  currentUsage: number;

  @Column({ type: 'int', default: 1 })
  maxUsagePerUser: number;

  @Column({ type: 'date' })
  validFrom: Date;

  @Column({ type: 'date' })
  validUntil: Date;

  @Column({
    type: 'enum',
    enum: PromotionStatus,
    default: PromotionStatus.ACTIVE,
  })
  status: PromotionStatus;

  @Column({ type: 'simple-array', nullable: true })
  applicableCategories: string[]; // IDs de categorías donde se puede usar

  @Column({ type: 'simple-array', nullable: true })
  applicableServices: string[]; // IDs de servicios específicos

  @Column({ type: 'boolean', default: false })
  isFirstTimeOnly: boolean; // Solo para usuarios nuevos

  @Column({ type: 'boolean', default: false })
  isProfessionalOnly: boolean; // Solo para profesionales

  @Column({ type: 'boolean', default: false })
  isClientOnly: boolean; // Solo para clientes

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PromotionUsage, (usage) => usage.promotion)
  usages: PromotionUsage[];

  // Métodos de utilidad
  isActive(): boolean {
    const now = new Date();
    return (
      this.status === PromotionStatus.ACTIVE &&
      now >= this.validFrom &&
      now <= this.validUntil &&
      (this.maxUsage === -1 || this.currentUsage < this.maxUsage)
    );
  }

  canBeUsedByUser(userId: string, userType: string): boolean {
    if (this.isProfessionalOnly && userType !== 'professional') {
      return false;
    }
    if (this.isClientOnly && userType !== 'client') {
      return false;
    }
    return true;
  }

  calculateDiscount(serviceAmount: number): number {
    if (serviceAmount < this.minimumAmount) {
      return 0;
    }

    let discount = 0;
    if (this.type === PromotionType.PERCENTAGE) {
      discount = (serviceAmount * this.discountValue) / 100;
    } else if (this.type === PromotionType.FIXED_AMOUNT) {
      discount = this.discountValue;
    }

    if (this.maximumDiscount && discount > this.maximumDiscount) {
      discount = this.maximumDiscount;
    }

    return Math.min(discount, serviceAmount);
  }
}
