import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

// `documentType`/`countryId` no son editables — cambiarlos rompería a qué versión "pertenece"
// esta fila. Para eso se crea una versión nueva, no se edita esta.
export class UpdateLegalDocumentVersionRequestDTO {
  @ApiPropertyOptional({ description: 'Etiqueta de versión', example: '1.0.1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional({
    description: 'URL del texto legal real',
    example: 'https://tekoapp.com.py/legal/tos-1.0.1',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  contentUrl?: string;

  @ApiPropertyOptional({ description: 'Fecha de publicación' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ description: 'Si la versión está activa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
