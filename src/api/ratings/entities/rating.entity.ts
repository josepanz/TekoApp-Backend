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
import { User } from '../../../modules/users/entities/user.entity';
import { Professional } from '../../professionals/entities/professional.entity';
import { ServiceRequest } from '../../services/entities/service-request.entity';

export enum RatingType {
  CLIENT_TO_PROFESSIONAL = 'client_to_professional',
  PROFESSIONAL_TO_CLIENT = 'professional_to_client',
}

@Entity('ratings')
@Index(['userId', 'professionalId', 'serviceRequestId'], { unique: true })
@Index(['professionalId', 'rating'])
@Index(['userId', 'rating'])
@Check('rating >= 1 AND rating <= 5')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  professionalId: string;

  @Column({ type: 'uuid' })
  serviceRequestId: string;

  @Column({
    type: 'enum',
    enum: RatingType,
    comment: 'Tipo de calificación: cliente a profesional o viceversa',
  })
  type: RatingType;

  @Column({ type: 'int', comment: 'Calificación de 1 a 5 estrellas' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', nullable: true })
  criteria: {
    punctuality?: number;
    quality?: number;
    communication?: number;
    cleanliness?: number;
    value?: number;
  };

  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isReported: boolean;

  @Column({ type: 'text', nullable: true })
  reportReason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

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
  isValidRating(): boolean {
    return this.rating >= 1 && this.rating <= 5;
  }

  getAverageCriteria(): number {
    if (!this.criteria) return this.rating;

    const criteriaValues = Object.values(this.criteria).filter(
      (value) => value !== undefined,
    );
    if (criteriaValues.length === 0) return this.rating;

    return (
      criteriaValues.reduce((sum, value) => sum + value, 0) /
      criteriaValues.length
    );
  }

  isClientRating(): boolean {
    return this.type === RatingType.CLIENT_TO_PROFESSIONAL;
  }

  isProfessionalRating(): boolean {
    return this.type === RatingType.PROFESSIONAL_TO_CLIENT;
  }

  canBeEdited(): boolean {
    // Solo se puede editar en las primeras 24 horas
    const hoursSinceCreation =
      (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 24;
  }

  canBeDeleted(): boolean {
    // Solo se puede eliminar si no está verificado y no tiene respuestas
    return !this.isVerified;
  }
}
