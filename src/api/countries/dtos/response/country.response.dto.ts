import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CountryResponseDTO {
  @ApiProperty({ description: 'ID del país', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Nombre común', example: 'Paraguay' })
  commonName!: string;

  @ApiProperty({
    description: 'Nombre oficial',
    example: 'República del Paraguay',
  })
  officialName!: string;

  @ApiProperty({ description: 'Código ISO 3166-1 alfa-2', example: 'PY' })
  iso2!: string;

  @ApiProperty({ description: 'Código ISO 3166-1 alfa-3', example: 'PRY' })
  iso3!: string;

  @ApiProperty({ description: 'Código numérico ISO 3166-1', example: '600' })
  numericCode!: string;

  @ApiProperty({ description: 'Prefijo telefónico', example: '+595' })
  phonePrefixCode!: string;

  @ApiPropertyOptional({
    description: 'Observaciones',
    example: null,
    nullable: true,
  })
  observations!: string | null;

  @ApiProperty({ description: 'Indica si el país está activo', example: true })
  isActive!: boolean;
}
