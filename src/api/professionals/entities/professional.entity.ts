import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from '../../../modules/users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';
import { Rating } from '../../ratings/entities/rating.entity';
import { ProfessionalCategory } from './professional-category.entity';

export enum ProfessionalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('professionals')
@Index(['userId'], { unique: true })
@Index(['status'])
@Index(['isAvailable'])
export class Professional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixedRate?: number;

  @Column({ type: 'varchar', length: 100, array: true, default: [] })
  skills: string[];

  @Column({ type: 'varchar', length: 100, array: true, default: [] })
  certifications: string[];

  @Column({ type: 'int', default: 0 })
  yearsOfExperience: number;

  @Column({
    type: 'enum',
    enum: ProfessionalStatus,
    default: ProfessionalStatus.PENDING,
  })
  status: ProfessionalStatus;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({ type: 'boolean', default: false })
  isAvailable: boolean;

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLatitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLongitude?: number;

  @Column({ type: 'timestamp', nullable: true })
  lastLocationUpdate?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImage?: string;

  @Column({ type: 'varchar', length: 255, array: true, default: [] })
  portfolioImages: string[];

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt?: Date;

  @Column({ type: 'int', default: 0 })
  totalServices: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToOne(() => User, (user) => user.professional)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ProfessionalCategory, (category) => category.professionals)
  @JoinColumn({ name: 'categoryId' })
  category: ProfessionalCategory;

  @OneToMany(() => Service, (service) => service.professional)
  services: Service[];

  @OneToMany(() => Rating, (rating) => rating.toProfessional)
  ratings: Rating[];

  // Métodos
  get isActive(): boolean {
    return this.status === ProfessionalStatus.APPROVED && this.isAvailable;
  }

  get isVerified(): boolean {
    return this.verificationStatus === VerificationStatus.VERIFIED;
  }

  get canAcceptServices(): boolean {
    return this.isActive && this.isOnline && this.isVerified;
  }

  get location(): { latitude: number; longitude: number } | null {
    if (this.currentLatitude && this.currentLongitude) {
      return {
        latitude: this.currentLatitude,
        longitude: this.currentLongitude,
      };
    }
    return null;
  }

  updateLocation(latitude: number, longitude: number): void {
    this.currentLatitude = latitude;
    this.currentLongitude = longitude;
    this.lastLocationUpdate = new Date();
  }

  updateRating(newRating: number): void {
    this.totalRatings += 1;
    const totalRating =
      this.averageRating * (this.totalRatings - 1) + newRating;
    this.averageRating = totalRating / this.totalRatings;
  }
}
