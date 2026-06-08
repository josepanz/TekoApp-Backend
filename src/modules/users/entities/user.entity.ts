import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { Professional } from '../../../api/professionals/entities/professional.entity';
import { Service } from '../../../api/services/entities/service.entity';
import { Rating } from '../../../api/ratings/entities/rating.entity';

export enum UserRole {
  CLIENT = 'client',
  PROFESSIONAL = 'professional',
  ADMIN = 'admin',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  avatar?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  phoneVerifiedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToOne(() => Professional, (professional) => professional.user)
  professional?: Professional;

  @OneToMany(() => Service, (service) => service.client)
  servicesAsClient: Service[];

  @OneToMany(() => Service, (service) => service.professional)
  servicesAsProfessional: Service[];

  @OneToMany(() => Rating, (rating) => rating.user)
  ratingsGiven: Rating[];

  @OneToMany(() => Rating, (rating) => rating.user)
  ratingsReceived: Rating[];

  // Métodos
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isProfessional(): boolean {
    return this.role === UserRole.PROFESSIONAL;
  }

  get isClient(): boolean {
    return this.role === UserRole.CLIENT;
  }

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
}
