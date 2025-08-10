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
import { User } from '../../users/entities/user.entity';
import { PaymentMethod, PaymentProvider } from './payment.entity';

@Entity('payment_methods')
@Index(['userId', 'isDefault'])
@Index(['userId', 'type'])
export class PaymentMethodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  type: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  provider: PaymentProvider;

  @Column({ type: 'varchar', length: 255 })
  name: string; // "Mi tarjeta principal", "Cuenta bancaria", etc.

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb' })
  details: {
    // Para tarjetas
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    cardholderName?: string;
    
    // Para cuentas bancarias
    bankName?: string;
    accountType?: string;
    accountLast4?: string;
    routingNumber?: string;
    
    // Para wallets digitales
    walletType?: string;
    walletEmail?: string;
    
    // Para crypto
    cryptoAddress?: string;
    cryptoNetwork?: string;
    
    // Token del proveedor de pagos
    providerToken?: string;
  };

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalId: string; // ID en el proveedor de pagos

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Métodos de ayuda
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isCard(): boolean {
    return this.type === PaymentMethod.CREDIT_CARD || this.type === PaymentMethod.DEBIT_CARD;
  }

  isBankAccount(): boolean {
    return this.type === PaymentMethod.BANK_TRANSFER;
  }

  isDigitalWallet(): boolean {
    return this.type === PaymentMethod.DIGITAL_WALLET;
  }

  isCrypto(): boolean {
    return this.type === PaymentMethod.CRYPTO;
  }

  getMaskedNumber(): string {
    if (this.isCard()) {
      return `**** **** **** ${this.details.cardLast4 || '****'}`;
    }
    if (this.isBankAccount()) {
      return `****${this.details.accountLast4 || '****'}`;
    }
    return '****';
  }

  getDisplayName(): string {
    if (this.isCard()) {
      const brand = this.details.cardBrand || 'Card';
      const last4 = this.details.cardLast4 || '****';
      return `${brand} ending in ${last4}`;
    }
    if (this.isBankAccount()) {
      const bank = this.details.bankName || 'Bank';
      const last4 = this.details.accountLast4 || '****';
      return `${bank} account ending in ${last4}`;
    }
    return this.name;
  }

  canBeUsed(): boolean {
    return this.isActive && !this.isExpired();
  }

  getExpirationStatus(): 'valid' | 'expiring_soon' | 'expired' {
    if (this.isExpired()) return 'expired';
    
    if (this.expiresAt) {
      const daysUntilExpiry = Math.ceil((this.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) return 'expiring_soon';
    }
    
    return 'valid';
  }
}
