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

import { Service } from './service.entity';
import { Professional } from '../../professionals/entities/professional.entity';

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@Entity('service_requests')
@Index(['serviceId'])
@Index(['professionalId'])
@Index(['status'])
@Index(['createdAt'])
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  serviceId: string;

  @Column({ type: 'uuid' })
  professionalId: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  proposedPrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  proposedHours?: number;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Service, (service) => service.requests)
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @ManyToOne(() => Professional, (professional) => professional.id)
  @JoinColumn({ name: 'professionalId' })
  professional: Professional;

  // Métodos
  get isActive(): boolean {
    return this.status === RequestStatus.PENDING;
  }

  get isAccepted(): boolean {
    return this.status === RequestStatus.ACCEPTED;
  }

  get isRejected(): boolean {
    return this.status === RequestStatus.REJECTED;
  }

  get isWithdrawn(): boolean {
    return this.status === RequestStatus.WITHDRAWN;
  }

  canBeAccepted(): boolean {
    return this.status === RequestStatus.PENDING;
  }

  canBeRejected(): boolean {
    return this.status === RequestStatus.PENDING;
  }

  canBeWithdrawn(): boolean {
    return this.status === RequestStatus.PENDING;
  }

  markAsRead(): void {
    this.isRead = true;
  }

  respond(status: RequestStatus, reason?: string): void {
    this.status = status;
    this.respondedAt = new Date();
    if (reason) {
      this.rejectionReason = reason;
    }
  }
}
