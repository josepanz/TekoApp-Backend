import { ConfigService } from '@nestjs/config';

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
});
