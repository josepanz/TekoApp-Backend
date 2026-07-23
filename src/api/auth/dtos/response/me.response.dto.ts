import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Perfil del usuario autenticado (`GET /auth/me`).
 * IMPORTANTE: nunca expone el `id` interno; el identificador público es
 * `referenceId`.
 */
export class MeResponseDTO {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Identificador público del usuario (referenceId).',
  })
  id!: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email.' })
  email!: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre.' })
  firstName!: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido.' })
  lastName!: string;

  @ApiProperty({ example: 'ACTIVE', description: 'Estado del usuario.' })
  status!: string;

  @ApiProperty({ example: 'COMPLETE', description: 'Estado del perfil.' })
  profileStatus!: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Nivel de acceso del usuario.',
    nullable: true,
  })
  accessLevelId?: number | null;

  @ApiProperty({
    example: ['ADMIN'],
    description: 'Roles del usuario.',
    type: [String],
  })
  roles!: string[];

  @ApiProperty({
    example: ['users:read'],
    description: 'Permisos efectivos del usuario (roles + directos).',
    type: [String],
  })
  permissions!: string[];
}
