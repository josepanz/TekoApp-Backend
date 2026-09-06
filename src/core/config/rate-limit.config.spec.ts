import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const mockRedisStoreConstructor = jest.fn();
const mockRateLimit = jest.fn();
const mockRedisCall = jest.fn();

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
  default: jest.fn(() => ({ call: mockRedisCall })),
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
        send: jest.fn().mockReturnThis(),
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
      expect(res.send).toHaveBeenCalledWith(optionsUsed.message);

      warnSpy.mockRestore();
    });
  });
});
