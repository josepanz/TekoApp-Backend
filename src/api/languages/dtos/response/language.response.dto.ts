import { ApiProperty } from '@nestjs/swagger';

export class LanguageResponseDTO {
  @ApiProperty({ description: 'ID del idioma', example: 1 })
  id!: number;

  @ApiProperty({
    description: 'Código ISO 639-1 (con región opcional, ej. es-PY)',
    example: 'es',
  })
  code!: string;

  @ApiProperty({
    description: 'Nombre del idioma en su propio idioma',
    example: 'Español',
  })
  name!: string;

  @ApiProperty({
    description: 'Indica si el idioma está activo',
    example: true,
  })
  isActive!: boolean;
}
