import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Professional } from '../../professionals/entities/professional.entity';
import { Service } from '../../services/entities/service.entity';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

@Entity('categories')
@Index(['name', 'status'])
@Index(['slug'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({
    type: 'enum',
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE,
  })
  status: CategoryStatus;

  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  @Column({ type: 'boolean', default: false })
  requiresVerification: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  parentCategoryId: string;

  @OneToMany(() => Professional, (professional) => professional.category)
  professionals: Professional[];

  @OneToMany(() => Service, (service) => service.category)
  services: Service[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos de ayuda
  generateSlug(): void {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  isActive(): boolean {
    return this.status === CategoryStatus.ACTIVE && this.isVisible;
  }

  getProfessionalCount(): number {
    return this.professionals?.length || 0;
  }

  getServiceCount(): number {
    return this.services?.length || 0;
  }
}
