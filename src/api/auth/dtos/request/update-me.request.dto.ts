import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Autoedición de perfil (`PUT /auth/me`) — solo campos que el propio usuario puede tocar sobre sí
 * mismo. Deliberadamente NO incluye `email`, `status`, `accessLevelId` ni ningún campo
 * administrativo — eso sigue exclusivamente en `PUT /users/:id` (requiere `USER.UPDATE`/`ADMIN.ALL`).
 */
export class UpdateMeRequestDTO {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+595981234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6.jpg',
    description:
      'Key de S3 devuelta por el campo `key` de POST /uploads/avatar — este endpoint solo ' +
      'persiste la key, no sube el archivo. La respuesta expone `avatarUrl` (una URL presignada ' +
      'resuelta fresca en el momento de la lectura, nunca la key cruda).',
  })
  @IsOptional()
  @IsString()
  avatarKey?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Tarea 8 (platform-hardening-2026-09): si el propio usuario permite que su email/' +
      'teléfono se expongan en ServiceUserSummaryResponseDTO (a quien pueda ver el servicio, ' +
      'ej. el profesional viendo el contacto del cliente). Default true en la base — esto es ' +
      'un opt-out explícito, no un opt-in.',
  })
  @IsOptional()
  @IsBoolean()
  shareContactInfo?: boolean;
}
