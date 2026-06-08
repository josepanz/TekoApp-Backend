import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from '../../../modules/users/entities/user.entity';
import { Professional } from '../../professionals/entities/professional.entity';
import { ServiceRequest } from './service-request.entity';

export enum ServiceStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum ServiceType {
  HOURLY = 'hourly',
  FIXED = 'fixed',
  EMERGENCY = 'emergency',
}

@Entity('services')
@Index(['status'])
@Index(['clientId'])
@Index(['professionalId'])
@Index(['categoryId'])
@Index(['createdAt'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  professionalId?: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.HOURLY,
  })
  type: ServiceType;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status: ServiceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedHours?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualHours?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixedPrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'text', nullable: true })
  additionalNotes?: string;

  @Column({ type: 'varchar', length: 255, array: true, default: [] })
  images: string[];

  @Column({ type: 'boolean', default: false })
  isUrgent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  clientRating?: number;

  @Column({ type: 'text', nullable: true })
  clientReview?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  professionalRating?: number;

  @Column({ type: 'text', nullable: true })
  professionalReview?: string;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, (user) => user.servicesAsClient)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => Professional, (professional) => professional.services)
  @JoinColumn({ name: 'professionalId' })
  professional: Professional;

  @OneToMany(() => ServiceRequest, (request) => request.service)
  requests: ServiceRequest[];

  // Métodos
  get isActive(): boolean {
    return [
      ServiceStatus.PENDING,
      ServiceStatus.ACCEPTED,
      ServiceStatus.IN_PROGRESS,
    ].includes(this.status);
  }

  get isCompleted(): boolean {
    return this.status === ServiceStatus.COMPLETED;
  }

  get isCancelled(): boolean {
    return this.status === ServiceStatus.CANCELLED;
  }

  get location(): { latitude: number; longitude: number } {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  calculateTotalAmount(): number {
    if (this.type === ServiceType.FIXED) {
      return this.fixedPrice || 0;
    } else if (this.type === ServiceType.HOURLY) {
      const hours = this.estimatedHours || 0;
      const rate = this.hourlyRate || 0;
      return hours * rate;
    }
    return 0;
  }

  canBeAccepted(): boolean {
    return this.status === ServiceStatus.PENDING;
  }

  canBeStarted(): boolean {
    return this.status === ServiceStatus.ACCEPTED;
  }

  canBeCompleted(): boolean {
    return this.status === ServiceStatus.IN_PROGRESS;
  }

  canBeCancelled(): boolean {
    return [
      ServiceStatus.PENDING,
      ServiceStatus.ACCEPTED,
      ServiceStatus.IN_PROGRESS,
    ].includes(this.status);
  }
}
