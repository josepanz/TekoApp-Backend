import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FindAllNotificationsQueryDTO {
  @ApiPropertyOptional({
    description: 'Límite máximo de notificaciones a retornar en la consulta',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  readonly limit: number = 20;

  @ApiPropertyOptional({
    description: 'Cantidad de registros a omitir para paginación (Offset)',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly offset: number = 0;
}
