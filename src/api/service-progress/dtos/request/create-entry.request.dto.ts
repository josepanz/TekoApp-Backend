import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateServiceProgressEntryRequestDTO {
  @ApiPropertyOptional({ description: 'Nota sobre el avance' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({
    description:
      'Keys de S3 de las fotos, ya subidas vía POST /uploads/image — mismo patrón que ' +
      'Services.images. El máximo real por entrada lo valida el service contra ' +
      'APP_CONFIG.progressLog.maxImagesPerEntry (configurable, no hardcodeado acá).',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20) // tope duro del DTO — la config decide el límite real, más bajo, en el service
  @IsString({ each: true })
  images?: string[];
}
