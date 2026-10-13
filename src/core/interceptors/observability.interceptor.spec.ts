/**
 * Suite: ObservabilityInterceptor, nivel y status de las líneas "Not OK" / "Error" (DEF-BE-031).
 * Casos: CP-BE-ENV-004 (ver test/qa/casos/CP-ENV.md)
 * Tipo: unitaria   Prioridad: P2
 * Precondiciones: PinoLogger mockeado; sin infraestructura.
 * Trazabilidad: DEF-BE-031 (detectado en los logs del e2e W2).
 */
import {
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import {
  levelFor,
  ObservabilityInterceptor,
} from './observability.interceptor';

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

/** `res.statusCode` queda en 201 (default de un POST): el filtro de excepciones todavía no corrió. */
const makeContext = (statusCode = 201): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        url: '/api/v1/professionals/1/suspend',
        body: { reason: 'x' },
        'x-trace-id': 'trace-1',
      }),
      getResponse: () => ({ statusCode }),
    }),
  }) as unknown as ExecutionContext;

describe('ObservabilityInterceptor', () => {
  let interceptor: ObservabilityInterceptor;

  beforeEach(() => {
    interceptor = new ObservabilityInterceptor(logger as never);
  });

  afterEach(() => jest.clearAllMocks());

  const runWithError = async (error: unknown) => {
    await expect(
      lastValueFrom(
        interceptor.intercept(makeContext(), {
          handle: () => throwError(() => error),
        }),
      ),
    ).rejects.toBe(error);
  };

  describe('levelFor', () => {
    it.each([
      [302, 'warn'],
      [400, 'warn'],
      [409, 'warn'],
      [499, 'warn'],
      [500, 'error'],
      [503, 'error'],
    ])('status %i -> %s', (status, level) => {
      expect(levelFor(status)).toBe(level);
    });
  });

  describe('errores', () => {
    it('un 4xx manejado (409) se loguea como WARN con el status real, no como "201 - CREATED", y sin stack', async () => {
      await runWithError(new ConflictException('estado inválido'));

      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledTimes(1);
      const [payload, message] = logger.warn.mock.calls[0] as [
        { stack?: string; error: string },
        string,
      ];
      expect(message).toContain('(409 - CONFLICT)');
      expect(message).not.toContain('201');
      expect(payload.stack).toBeUndefined();
      expect(payload.error).toBe('estado inválido');
    });

    it.each([
      [new ForbiddenException(), '(403 - FORBIDDEN)'],
      [new HttpException('x', 400), '(400 - BAD_REQUEST)'],
      [new HttpException('x', 404), '(404 - NOT_FOUND)'],
    ])('otros 4xx (%#) también son WARN con su status', async (error, text) => {
      await runWithError(error);

      expect(logger.error).not.toHaveBeenCalled();
      expect((logger.warn.mock.calls[0] as string[])[1]).toContain(text);
    });

    it('un 5xx HttpException es ERROR con su status y con stack', async () => {
      await runWithError(new InternalServerErrorException('boom'));

      expect(logger.warn).not.toHaveBeenCalled();
      const [payload, message] = logger.error.mock.calls[0] as [
        { stack?: string },
        string,
      ];
      expect(message).toContain('(500 - INTERNAL_SERVER_ERROR)');
      expect(payload.stack).toEqual(expect.any(String));
    });

    it('una excepción no HTTP (TypeError, error de Prisma) es ERROR con status 500 aunque res.statusCode sea 201', async () => {
      await runWithError(new TypeError('x is undefined'));

      expect(logger.warn).not.toHaveBeenCalled();
      const [payload, message] = logger.error.mock.calls[0] as [
        { stack?: string; error: string },
        string,
      ];
      expect(message).toContain('(500 - INTERNAL_SERVER_ERROR)');
      expect(payload.error).toBe('x is undefined');
      expect(payload.stack).toEqual(expect.any(String));
    });
  });

  describe('respuestas sin excepción', () => {
    it('un 2xx se loguea como info "Success"', async () => {
      await lastValueFrom(
        interceptor.intercept(makeContext(201), {
          handle: () => of({ ok: true }),
        }),
      );

      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
      expect((logger.info.mock.calls[1] as string[])[1]).toContain(
        '(201 - CREATED)',
      );
    });

    it('una respuesta no 2xx por debajo de 500 (ej. 400 devuelto sin lanzar) es WARN, no ERROR', async () => {
      await lastValueFrom(
        interceptor.intercept(makeContext(400), {
          handle: () => of({ message: 'x' }),
        }),
      );

      expect(logger.error).not.toHaveBeenCalled();
      expect((logger.warn.mock.calls[0] as string[])[1]).toContain(
        '(400 - BAD_REQUEST)',
      );
    });

    it('una respuesta 5xx devuelta sin lanzar es ERROR', async () => {
      await lastValueFrom(
        interceptor.intercept(makeContext(502), {
          handle: () => of({ message: 'x' }),
        }),
      );

      expect(logger.warn).not.toHaveBeenCalled();
      expect((logger.error.mock.calls[0] as string[])[1]).toContain(
        '(502 - BAD_GATEWAY)',
      );
    });
  });
});
