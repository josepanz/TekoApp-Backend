/**
 * Suite: ValidationExceptionFilter (envelope 400 con error.error y errors[])
 * Casos: CP-BE-ERR-008 (ver test/qa/casos/CP-AUTH.md)
 * Tipo: unitaria   Prioridad: P1
 * Precondiciones: ninguna (host/response mockeados)
 * Trazabilidad: DEF-BE-007
 */
import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ValidationExceptionFilter } from './validation-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn(() => ({ json: mockJson }));

const host = {
  switchToHttp: () => ({
    getResponse: () => ({ status: mockStatus }),
    getRequest: () => ({ url: '/t' }),
  }),
} as unknown as ArgumentsHost;

describe('ValidationExceptionFilter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('incluye error.error "Bad Request" y conserva errors[] cuando message es un array', () => {
    const errors = [{ field: 'email', constraints: { isEmail: 'x' } }];

    new ValidationExceptionFilter().catch(
      new BadRequestException({ message: errors }),
      host,
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    const body = (mockJson.mock.calls[0] as unknown[])[0] as {
      success: boolean;
      error: Record<string, unknown>;
    };
    expect(body.success).toBe(false);
    expect(body.error).toMatchObject({
      code: 400,
      error: 'Bad Request',
      errors,
      path: '/t',
    });
  });

  it('incluye error.error también cuando message es un string', () => {
    new ValidationExceptionFilter().catch(
      new BadRequestException('Las contraseñas no coinciden'),
      host,
    );

    const body = (mockJson.mock.calls[0] as unknown[])[0] as {
      error: Record<string, unknown>;
    };
    expect(body.error.message).toBe('Las contraseñas no coinciden');
    expect(body.error.error).toBe('Bad Request');
  });
});
