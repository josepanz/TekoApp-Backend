import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Professional } from '../../professionals/entities/professional.entity';
import { ServiceRequest } from '../../services/entities/service-request.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  CASH = 'cash',
  CRYPTO = 'crypto',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  MERCADOPAGO = 'mercadopago',
  RAPIPAGO = 'rapipago',
  PAGOFACIL = 'pagofacil',
  CASH = 'cash',
}

@Entity('payments')
@Index(['userId', 'serviceRequestId'], { unique: true })
@Index(['professionalId', 'status'])
@Index(['status', 'createdAt'])
@Index(['transactionId'], { unique: true })
@Check('amount > 0')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  professionalId: string;

  @Column({ type: 'uuid' })
  serviceRequestId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  paymentProvider: PaymentProvider;

  @Column({ type: 'varchar', length: 255, unique: true })
  transactionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalTransactionId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails: {
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    bankName?: string;
    accountLast4?: string;
    walletType?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'jsonb', nullable: true })
  refundDetails: {
    refundedAmount?: number;
    refundReason?: string;
    refundedAt?: Date;
  };

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurringInterval: string; // monthly, weekly, etc.

  @Column({ type: 'timestamp', nullable: true })
  nextPaymentDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Professional, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professionalId' })
  professional: Professional;

  @ManyToOne(() => ServiceRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceRequestId' })
  serviceRequest: ServiceRequest;

  // Métodos de ayuda
  isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  isRefundable(): boolean {
    return this.status === PaymentStatus.COMPLETED && !this.refundDetails?.refundedAmount;
  }

  getRefundableAmount(): number {
    if (!this.isRefundable()) return 0;
    const refundedAmount = this.refundDetails?.refundedAmount || 0;
    return this.totalAmount - refundedAmount;
  }

  calculateTotalAmount(): number {
    return this.amount + this.fee + this.tax;
  }

  getProcessingTime(): number | null {
    if (!this.processedAt || !this.createdAt) return null;
    return this.processedAt.getTime() - this.createdAt.getTime();
  }

  canBeCancelled(): boolean {
    return this.status === PaymentStatus.PENDING || this.status === PaymentStatus.PROCESSING;
  }

  getStatusColor(): string {
    switch (this.status) {
      case PaymentStatus.COMPLETED:
        return 'green';
      case PaymentStatus.PENDING:
        return 'yellow';
      case PaymentStatus.PROCESSING:
        return 'blue';
      case PaymentStatus.FAILED:
        return 'red';
      case PaymentStatus.CANCELLED:
        return 'gray';
      case PaymentStatus.REFUNDED:
        return 'orange';
      default:
        return 'gray';
    }
  }
}
