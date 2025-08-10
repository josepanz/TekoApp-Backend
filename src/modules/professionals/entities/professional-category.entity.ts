import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { Professional } from './professional.entity';

@Entity('professional_categories')
@Index(['name'], { unique: true })
@Index(['isActive'])
export class ProfessionalCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image?: string;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  color: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseHourlyRate?: number;

  @Column({ type: 'text', array: true, default: [] })
  requiredSkills: string[];

  @Column({ type: 'text', array: true, default: [] })
  requiredCertifications: string[];

  @Column({ type: 'int', default: 0 })
  totalProfessionals: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Professional, (professional) => professional.category)
  professionals: Professional[];

  // Métodos
  get isPopular(): boolean {
    return this.totalProfessionals > 10;
  }

  get hasRequiredCredentials(): boolean {
    return this.requiredSkills.length > 0 || this.requiredCertifications.length > 0;
  }

  updateProfessionalsCount(): void {
    this.totalProfessionals = this.professionals?.length || 0;
  }

  updateAverageRating(): void {
    if (this.professionals && this.professionals.length > 0) {
      const totalRating = this.professionals.reduce((sum, prof) => sum + prof.averageRating, 0);
      this.averageRating = totalRating / this.professionals.length;
    }
  }
}
