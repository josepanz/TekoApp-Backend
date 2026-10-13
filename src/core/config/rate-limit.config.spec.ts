/**
 * Suite: RateLimitConfig: prefijos Redis por limitador y RATE_LIMIT_MULTIPLIER (ignorado con NODE_ENV=production)
 * Casos: CP-BE-ENV-003 (ver test/qa/casos/CP-ENV.md)
 * Tipo: unitaria   Prioridad: P0
 * Precondiciones: Redis y express-rate-limit mockeados
 * Trazabilidad: M0 del plan maestro: rate-limit relajado solo en e2e
 */
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const mockRedisStoreConstructor = jest.fn();
const mockRateLimit = jest.fn();
const mockRedisCall = jest.fn();
const mockRedisQuit = jest.fn();

jest.mock('rate-limit-redis', () => ({
  __esModule: true,
  default: jest.fn((options: { prefix?: string }) => {
    mockRedisStoreConstructor(options);
    return { kind: 'redis-store', prefix: options.prefix };
  }),
}));

jest.mock('express-rate-limit', () => ({
  __esModule: true,
  default: jest.fn((options: Record<string, unknown>) => {
    mockRateLimit(options);
    return options;
  }),
}));

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => ({ call: mockRedisCall, quit: mockRedisQuit })),
}));

import { RateLimitConfig } from './rate-limit.config';

describe('RateLimitConfig', () => {
  const configService = {
    get: jest.fn((key: string, fallback?: unknown) => fallback),
  } as unknown as ConfigService;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLimiter', () => {
    it('debe darle a cada limitador su propio prefijo de Redis, nunca uno compartido', () => {
      // Arrange
      // (el mock de `rate-limit-redis` registra el `prefix` de cada instancia construida)

      // Act
      RateLimitConfig.createLimiter(configService);

      // Assert
      const prefijos = mockRedisStoreConstructor.mock.calls.map(
        ([options]: [{ prefix?: string }]) => options.prefix,
      );

      expect(prefijos).toEqual([
        'rl:general:',
        'rl:auth:',
        'rl:upload:',
        'rl:payment:',
        'rl:search:',
      ]);
      expect(new Set(prefijos).size).toBe(prefijos.length);
    });

    it('debe evitar que el contador del limitador general sea leído por el de auth', () => {
      // Arrange
      // Regresión de un bloqueo real (2026-09-05): sin `prefix` propio, `rate-limit-redis` usa
      // `rl:` para todos, así que 5 requests de cualquier tipo desde una IP agotaban el cupo de
      // auth (max 5) al compartir contador con el general (max 100).

      // Act
      RateLimitConfig.createLimiter(configService);

      // Assert
      const [generalOptions, authOptions] = mockRedisStoreConstructor.mock.calls
        .slice(0, 2)
        .map(([options]: [{ prefix?: string }]) => options);

      expect(generalOptions.prefix).not.toBe(authOptions.prefix);
    });
  });

  describe('RATE_LIMIT_MULTIPLIER', () => {
    const cfg = (env: Record<string, unknown>) =>
      ({
        get: jest.fn((key: string, fallback?: unknown) => env[key] ?? fallback),
      }) as unknown as ConfigService;
    const maxes = () =>
      mockRateLimit.mock.calls.map(([o]: [{ max: number }]) => o.max);

    it('sin la variable, los max quedan en los valores base', () => {
      RateLimitConfig.createLimiter(cfg({}));
      expect(maxes()).toEqual([100, 5, 10, 20, 30]);
    });

    it('escala todos los max cuando NODE_ENV no es production', () => {
      RateLimitConfig.createLimiter(
        cfg({ NODE_ENV: 'develop', RATE_LIMIT_MULTIPLIER: '10' }),
      );
      expect(maxes()).toEqual([1000, 50, 100, 200, 300]);
    });

    it('IGNORA el multiplicador si NODE_ENV=production', () => {
      RateLimitConfig.createLimiter(
        cfg({ NODE_ENV: 'production', RATE_LIMIT_MULTIPLIER: '1000' }),
      );
      expect(maxes()).toEqual([100, 5, 10, 20, 30]);
    });

    it.each(['abc', '0', '-3', '0.5', 'Infinity', ''])(
      'ignora el valor inválido %p y usa 1',
      (raw) => {
        expect(
          RateLimitConfig.resolveMultiplier(
            cfg({
              RATE_LIMIT_MULTIPLIER: raw,
            }),
          ),
        ).toBe(1);
      },
    );

    it('acepta el multiplicador numérico', () => {
      expect(
        RateLimitConfig.resolveMultiplier(cfg({ RATE_LIMIT_MULTIPLIER: 3 })),
      ).toBe(3);
    });
  });

  describe('handler de rechazo (429)', () => {
    it('debe loguear el limitador, metodo, ruta e IP, y responder con el status/message configurados', () => {
      // Arrange — H-03: un 429 corta la cadena antes de nestjs-pino y hoy no deja rastro en el
      // log; el `handler` propio debe dejar constancia antes de responder.
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const limiters = RateLimitConfig.createLimiter(configService);
      const authHandler = (
        limiters.auth as unknown as {
          handler: (
            req: unknown,
            res: unknown,
            next: unknown,
            optionsUsed: unknown,
          ) => void;
        }
      ).handler;

      const req = {
        method: 'POST',
        originalUrl: '/tekoapp-backend/api/v1/auth/nonce',
        ip: '127.0.0.1',
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const optionsUsed = {
        statusCode: 429,
        message: { error: 'Demasiados intentos', retryAfter: 900 },
      };

      // Act
      authHandler(req, res, jest.fn(), optionsUsed);

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('limiter=auth'),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('method=POST'),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('path=/tekoapp-backend/api/v1/auth/nonce'),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ip=127.0.0.1'),
      );
      expect(res.status).toHaveBeenCalledWith(429);
      // DEF-BE-005: envelope uniforme de error, no el {error,retryAfter} crudo
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 429,
          message: 'Demasiados intentos',
          error: 'Too Many Requests',
          retryAfter: 900,
          timestamp: expect.any(String) as string,
          path: '/tekoapp-backend/api/v1/auth/nonce',
        },
      });

      warnSpy.mockRestore();
    });
  });

  describe('closeRedisClient', () => {
    // El cliente vive en un singleton estático a propósito (ver comentario en la clase), fuera de
    // la DI de Nest: nada lo cierra solo. `test/app.e2e-spec.ts` depende de este método en su
    // `afterAll` para que `pnpm run test:e2e` termine solo en vez de quedar colgado.
    it('debe cerrar el cliente Redis compartido cuando ya fue creado', async () => {
      // Arrange
      RateLimitConfig.createLimiter(configService);

      // Act
      await RateLimitConfig.closeRedisClient();

      // Assert
      expect(mockRedisQuit).toHaveBeenCalled();
    });

    it('no debe fallar si todavía no se creó ningún cliente', async () => {
      // Arrange: la prueba anterior ya lo cerró y dejó el singleton en undefined.

      // Act & Assert
      await expect(RateLimitConfig.closeRedisClient()).resolves.not.toThrow();
      expect(mockRedisQuit).not.toHaveBeenCalled();
    });
  });
});
