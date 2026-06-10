import { ApiProperty } from '@nestjs/swagger';
import { RatingType } from '@prisma/client';

export class RatingDetailResponseDTO {
  @ApiProperty({
    description: 'ID único de la calificación',
    example: 'a63b5212-db5e-4ef5-9614-726614174000',
  })
  id!: string;

  @ApiProperty({ description: 'ID del usuario que calificó', example: 1 })
  userId!: number;

  @ApiProperty({ description: 'ID del profesional calificado', example: 1 })
  professionalId!: number;

  @ApiProperty({
    description: 'ID de la solicitud de servicio asociada',
    example: 'b72c6323-ec6f-5fg6-a725-837725285111',
    nullable: true,
  })
  serviceId!: string | null;

  @ApiProperty({
    description: 'Tipo de calificación',
    enum: RatingType,
    example: RatingType.CLIENT_TO_PROFESSIONAL,
  })
  type!: RatingType;

  @ApiProperty({ description: 'Calificación general (1-5)', example: 4.5 })
  rating!: number;

  @ApiProperty({
    description: 'Comentario de la calificación',
    example: 'Excelente trabajo',
    nullable: true,
  })
  review!: string | null;

  @ApiProperty({ description: 'Criterios de calificación', nullable: true })
  criteria!: Record<string, number> | null;

  @ApiProperty({ description: 'Si la calificación es anónima', example: false })
  isAnonymous!: boolean;

  @ApiProperty({
    description: 'Si la calificación fue reportada',
    example: false,
  })
  isReported!: boolean;

  @ApiProperty({ description: 'Motivo del reporte', nullable: true })
  reportReason!: string | null;

  @ApiProperty({ description: 'Si la calificación está activa', example: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiProperty({ description: 'Creado por (userId)', nullable: true })
  createdBy!: string | null;
}
