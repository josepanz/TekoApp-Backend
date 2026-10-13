/**
 * Suite: ValidationConfig.exceptionFactory (DEF-BE-001: antes devolvía un objeto plano => 500)
 * Casos: CP-BE-CAT-015, CP-BE-CAT-026, CP-BE-CAT-033, CP-BE-ERR-009 (ver test/qa/casos/CP-CAT.md y CP-AUTH.md)
 * Tipo: unitaria   Prioridad: P1
 * Precondiciones: ninguna (sin mocks)
 * Trazabilidad: DEF-BE-001
 */
import { BadRequestException } from '@nestjs/common';
import { IsInt, validateSync, ValidationError } from 'class-validator';
import { ValidationConfig } from './validation.config';

class Dto {
  @IsInt()
  n!: number;
}

describe('ValidationConfig.exceptionFactory', () => {
  const factory = ValidationConfig.getValidationOptions().exceptionFactory as (
    errors: ValidationError[],
  ) => unknown;

  it('devuelve una BadRequestException (no un objeto plano) para que no termine en 500', () => {
    const errors = validateSync(Object.assign(new Dto(), { n: 'x' }));

    const result = factory(errors);

    expect(result).toBeInstanceOf(BadRequestException);
    expect((result as BadRequestException).getStatus()).toBe(400);
  });

  it('conserva field/constraints/value de cada error en message[]', () => {
    const errors = validateSync(Object.assign(new Dto(), { n: 'x' }));

    const response = (factory(errors) as BadRequestException).getResponse() as {
      message: Array<{ field: string; value: unknown; constraints: unknown }>;
    };

    expect(response.message).toHaveLength(1);
    expect(response.message[0].field).toBe('n');
    expect(response.message[0].value).toBe('x');
    expect(response.message[0].constraints).toBeDefined();
  });

  it('traduce recursivamente los errores anidados', () => {
    const child = Object.assign(new ValidationError(), {
      property: 'c',
      constraints: { isInt: 'c must be an integer' },
    });
    const parent = Object.assign(new ValidationError(), {
      property: 'p',
      children: [child],
    });

    const response = (
      factory([parent]) as BadRequestException
    ).getResponse() as { message: Array<{ children: ValidationError[] }> };

    expect(response.message[0].children[0].property).toBe('c');
  });
});
