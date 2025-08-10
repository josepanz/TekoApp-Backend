import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';
import { PaymentMethodEntity } from './payment-method.entity';

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  CHARGEBACK = 'chargeback',
  ADJUSTMENT = 'adjustment',
  FEE = 'fee',
  TAX = 'tax',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

@Entity('payment_transactions')
@Index(['paymentId', 'type'])
@Index(['status', 'createdAt'])
@Index(['externalTransactionId'], { unique: true })
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentId: string;

  @Column({ type: 'uuid', nullable: true })
  paymentMethodId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  externalTransactionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalReference: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  transactionDetails: {
    authorizationCode?: string;
    responseCode?: string;
    responseMessage?: string;
    avsResult?: string;
    cvvResult?: string;
    processorResponse?: string;
    gatewayResponse?: string;
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
  errorDetails: {
    errorCode?: string;
    errorMessage?: string;
    errorType?: string;
    retryable?: boolean;
  };

  @Column({ type: 'boolean', default: false })
  isRetryable: boolean;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  webhookData: {
    receivedAt?: Date;
    payload?: Record<string, any>;
    signature?: string;
    verified?: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @ManyToOne(() => PaymentMethodEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: PaymentMethodEntity;

  // Métodos de ayuda
  isSuccessful(): boolean {
    return this.status === TransactionStatus.COMPLETED;
  }

  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  isFailed(): boolean {
    return this.status === TransactionStatus.FAILED;
  }

  canBeRetried(): boolean {
    return this.isRetryable && this.retryCount < 3;
  }

  getProcessingTime(): number | null {
    if (!this.processedAt || !this.createdAt) return null;
    return this.processedAt.getTime() - this.createdAt.getTime();
  }

  isPayment(): boolean {
    return this.type === TransactionType.PAYMENT;
  }

  isRefund(): boolean {
    return this.type === TransactionType.REFUND;
  }

  isChargeback(): boolean {
    return this.type === TransactionType.CHARGEBACK;
  }

  getAmountWithSign(): number {
    if (this.isRefund() || this.isChargeback()) {
      return -Math.abs(this.amount);
    }
    return Math.abs(this.amount);
  }

  getStatusColor(): string {
    switch (this.status) {
      case TransactionStatus.COMPLETED:
        return 'green';
      case TransactionStatus.PENDING:
        return 'yellow';
      case TransactionStatus.PROCESSING:
        return 'blue';
      case TransactionStatus.FAILED:
        return 'red';
      case TransactionStatus.CANCELLED:
        return 'gray';
      case TransactionStatus.REVERSED:
        return 'orange';
      default:
        return 'gray';
    }
  }

  shouldRetry(): boolean {
    return this.isRetryable && this.retryCount < 3 && this.status === TransactionStatus.FAILED;
  }

  getNextRetryDelay(): number {
    // Backoff exponencial: 1 min, 5 min, 15 min
    const delays = [60000, 300000, 900000];
    return delays[this.retryCount] || 900000;
  }
}
