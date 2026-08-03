import { IsMaxCommaSeparated } from '@common/decorators/max-comma-separated.decorator';
import { IsOrderByFormat } from '@common/validators';
import { IsEndDateAfterStartDate } from '@common/validators/date-range.validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Validate,
} from 'class-validator';

function parseDateFilterValue(
  value: unknown,
  options: { endOfDay: boolean },
): Date | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== 'string') {
    return new Date('invalid');
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const slashDateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmedValue);
  if (slashDateMatch) {
    const [, day, month, year] = slashDateMatch;
    return new Date(
      `${year}-${month}-${day}T${options.endOfDay ? '23:59:59.999' : '00:00:00'}`,
    );
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return new Date(
      `${trimmedValue}T${options.endOfDay ? '23:59:59.999' : '00:00:00'}`,
    );
  }

  return new Date(trimmedValue);
}

export class PaginationQueryDTO {
  @ApiPropertyOptional({
    description:
      'Pagina para paginación de resultados (opcional, por defecto 1)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: i18nValidationMessage('validation.PAGE_MIN') })
  page?: number;

  @ApiPropertyOptional({
    description:
      'Pagina para paginación de resultados (opcional, por defecto 10)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: i18nValidationMessage('validation.PAGE_SIZE_MIN') })
  pageSize?: number;

  @ApiPropertyOptional({
    description:
      'Campo por el cual ordenar los resultados (opcional, por defecto "fechaHora") y orden ascendente o descendente (opcional, por defecto "DESC"), separados por :',
    example: 'tradeName:desc',
  })
  @IsOptional()
  @IsString()
  @Validate(IsOrderByFormat)
  orderBy?: string;

  @ApiPropertyOptional({ description: 'Fecha de rango de inicio de consulta' })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => parseDateFilterValue(value, { endOfDay: false }))
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Fecha de rango de fin de consulta' })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => parseDateFilterValue(value, { endOfDay: true }))
  @Validate(IsEndDateAfterStartDate)
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Código/s de sucursal/es especifica hasta 10',
    required: false,
    example: '1,2,3',
  })
  @IsString({
    message: i18nValidationMessage('validation.BRANCH_CODE_MUST_BE_STRING'),
  })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.BRANCH_CODE_NOT_EMPTY'),
  })
  @IsMaxCommaSeparated(10, {
    message: i18nValidationMessage('validation.BRANCHES_TOO_MANY'),
  })
  branches?: string;
}

export class PaginationResponseDTO {
  @ApiProperty({
    description: 'Total de elementos encontrados.',
    example: 100,
  })
  @Type(() => Number)
  @IsNumber()
  total!: number;

  @ApiProperty({
    description:
      'Pagina para paginación de resultados (opcional, por defecto 1)',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  page!: number;

  @ApiProperty({
    description:
      'Pagina para paginación de resultados (opcional, por defecto 1).',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @ApiProperty({
    description: 'Total de paginas disponibles.',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  totalPages!: number;
}
