import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Promotion } from './promotion.entity';
import { User } from '../../../modules/users/entities/user.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity('promotion_usages')
export class PromotionUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Promotion, (promotion) => promotion.usages)
  @JoinColumn({ name: 'promotionId' })
  promotion: Promotion;

  @Column()
  promotionId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  usedAt: Date;
}
