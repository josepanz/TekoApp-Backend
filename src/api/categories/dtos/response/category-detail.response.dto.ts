import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from '@prisma/client';

export class CategoryDetailResponseDTO {
  @ApiProperty({ description: 'ID de la categoría', example: 1 })
  id!: number;

  @ApiProperty({
    description: 'Nombre único de la categoría',
    example: 'Plomería',
  })
  name!: string;

  @ApiProperty({
    description: 'Slug url-ready único',
    example: 'plomeria',
  })
  slug!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada',
    example: 'Servicios de reparación e instalaciones sanitarias',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    description: 'Nombre del icono o clase para renderizado',
    example: 'wrench-outline',
    nullable: true,
  })
  icon!: string | null;

  @ApiPropertyOptional({
    description: 'Color identificador en formato hexadecimal',
    example: '#2ecc71',
    nullable: true,
  })
  color!: string | null;

  @ApiProperty({
    description: 'Posición de ordenamiento',
    example: 0,
  })
  sortOrder!: number;

  @ApiProperty({
    description: 'Estado de la categoría',
    enum: CategoryStatus,
    example: CategoryStatus.ACTIVE,
  })
  status!: CategoryStatus;

  @ApiProperty({
    description: 'Indica si es visible públicamente',
    example: true,
  })
  isVisible!: boolean;

  @ApiProperty({
    description: 'Determina si exige acreditación de títulos/certificados',
    example: false,
  })
  requiresVerification!: boolean;

  @ApiPropertyOptional({
    description: 'Metadata dinámica JSONb',
    example: { taxRate: 10, minFee: 50000 },
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'ID de la categoría padre (null si es raíz)',
    example: null,
    nullable: true,
  })
  parentCategoryId!: number | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Fecha de última modificación',
    nullable: true,
  })
  lastChangedAt!: Date | null;
}
