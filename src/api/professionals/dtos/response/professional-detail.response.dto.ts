import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalStatus } from '@prisma/client';

export class UserSummaryResponseDTO {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'juan@example.com' })
  email!: string;

  @ApiProperty({ example: 'Juan' })
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  lastName!: string;

  @ApiPropertyOptional({ example: '+595981234567' })
  phoneNumber?: string | null;
}

export class CategorySummaryResponseDTO {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Plomería' })
  name!: string;

  @ApiProperty({ example: 'plomeria' })
  slug!: string;

  @ApiPropertyOptional({ example: 'wrench' })
  icon?: string | null;

  @ApiPropertyOptional({ example: '#FF5733' })
  color?: string | null;
}

export class ProfessionalDetailResponseDTO {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  referenceId!: string;

  @ApiProperty({ example: 5 })
  userId!: number;

  @ApiProperty({ example: 2 })
  categoryId!: number;

  @ApiProperty({ example: 'Plomero con 10 años de experiencia' })
  description!: string;

  @ApiProperty({ example: 50000 })
  hourlyRate!: number;

  @ApiPropertyOptional({ example: 200000 })
  fixedRate?: number | null;

  @ApiProperty({ example: ['plomería', 'gasfitería'] })
  skills!: string[];

  @ApiProperty({ example: ['Certificado SENAI'] })
  certifications!: string[];

  @ApiProperty({ example: 10 })
  yearsOfExperience!: number;

  @ApiProperty({
    enum: ProfessionalStatus,
    example: ProfessionalStatus.APPROVED,
  })
  status!: ProfessionalStatus;

  @ApiProperty({ example: true })
  isAvailable!: boolean;

  @ApiProperty({ example: false })
  isOnline!: boolean;

  @ApiProperty({ example: 'verified' })
  verificationStatus!: string;

  @ApiPropertyOptional({ example: -25.2637 })
  currentLatitude?: number | null;

  @ApiPropertyOptional({ example: -57.5759 })
  currentLongitude?: number | null;

  @ApiPropertyOptional()
  lastLocationUpdate?: Date | null;

  @ApiProperty({ example: 42 })
  totalServices!: number;

  @ApiProperty({ example: 4.8 })
  averageRating!: number;

  @ApiProperty({ example: 35 })
  totalRatings!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: UserSummaryResponseDTO })
  user!: UserSummaryResponseDTO;

  @ApiProperty({ type: CategorySummaryResponseDTO })
  category!: CategorySummaryResponseDTO;
}
