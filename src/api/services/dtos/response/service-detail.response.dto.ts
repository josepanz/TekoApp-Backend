import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatus } from '@prisma/client';

export class ServiceUserSummaryResponseDTO {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  referenceId!: string;

  @ApiProperty({ example: 'juan@example.com' })
  email!: string;

  @ApiProperty({ example: 'Juan' })
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  lastName!: string;

  @ApiPropertyOptional({ example: '+595981234567' })
  phoneNumber?: string | null;
}

export class ServiceProfessionalSummaryResponseDTO {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  referenceId!: string;

  @ApiProperty({ type: ServiceUserSummaryResponseDTO })
  user!: ServiceUserSummaryResponseDTO;
}

export class ServiceCategorySummaryResponseDTO {
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

export class ServiceDetailResponseDTO {
  @ApiProperty({ example: 'a63b5212-db5e-4ef5-9614-726614174000' })
  id!: string;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiPropertyOptional({ example: 2 })
  professionalId?: number | null;

  @ApiProperty({ example: 3 })
  categoryId!: number;

  @ApiProperty({ example: 4 })
  serviceTypeId!: number;

  @ApiProperty({ example: 'Reparación de cañería' })
  title!: string;

  @ApiProperty({ example: 'Se necesita reparar una cañería rota en el baño' })
  description!: string;

  @ApiProperty({ enum: ServiceStatus, example: ServiceStatus.PENDING })
  status!: ServiceStatus;

  @ApiPropertyOptional({ example: 2.5 })
  estimatedHours?: number | null;

  @ApiPropertyOptional({ example: 2.0 })
  actualHours?: number | null;

  @ApiPropertyOptional({ example: 50000 })
  hourlyRate?: number | null;

  @ApiPropertyOptional({ example: 150000 })
  fixedPrice?: number | null;

  @ApiPropertyOptional({ example: 125000 })
  totalAmount?: number | null;

  @ApiPropertyOptional({ example: 100000 })
  finalAmount?: number | null;

  @ApiProperty({ example: -25.2637 })
  latitude!: number;

  @ApiProperty({ example: -57.5759 })
  longitude!: number;

  @ApiProperty({ example: 'Av. España 1234, Asunción' })
  address!: string;

  @ApiPropertyOptional({ example: 'Tocar el timbre del primer piso' })
  additionalNotes?: string | null;

  @ApiProperty({ type: [String], example: ['https://example.com/img1.jpg'] })
  images!: string[];

  @ApiProperty({ example: false })
  isUrgent!: boolean;

  @ApiPropertyOptional()
  scheduledAt?: Date | null;

  @ApiPropertyOptional()
  startedAt?: Date | null;

  @ApiPropertyOptional()
  completedAt?: Date | null;

  @ApiPropertyOptional()
  cancelledAt?: Date | null;

  @ApiPropertyOptional({ example: 'El cliente canceló' })
  cancellationReason?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: ServiceUserSummaryResponseDTO })
  users!: ServiceUserSummaryResponseDTO;

  @ApiPropertyOptional({ type: ServiceProfessionalSummaryResponseDTO })
  professional?: ServiceProfessionalSummaryResponseDTO | null;

  @ApiPropertyOptional({ type: ServiceCategorySummaryResponseDTO })
  category?: ServiceCategorySummaryResponseDTO | null;
}
