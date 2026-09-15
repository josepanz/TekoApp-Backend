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

  @ApiPropertyOptional({
    example: 'https://cdn.tekoapp.com.py/avatars/abc123.jpg',
    description: 'URL pública de la foto de perfil.',
    nullable: true,
  })
  avatarUrl?: string | null;

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

  @ApiPropertyOptional({
    example: true,
    description:
      'Tarea 8 (platform-hardening-2026-09): si el email/teléfono de este usuario se exponen ' +
      'en ServiceUserSummaryResponseDTO. Solo presente en la respuesta de PUT /auth/me (lectura ' +
      'fresca de DB tras la edición) — GET /auth/me lee directo del JWT, que no lleva este ' +
      'campo (deliberado: no se tocó el payload del token para esta tarea), así que ahí siempre ' +
      'viene ausente.',
  })
  shareContactInfo?: boolean;
}
