import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

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
    example: 'https://cdn.tekoapp.com.py/avatars/abc123.jpg',
    description:
      'URL devuelta por POST /uploads/avatar — este endpoint solo persiste la URL, no sube el archivo.',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
