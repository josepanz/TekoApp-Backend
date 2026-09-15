import { ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';
import { TraceIdMiddleware } from '@/core/middlewares/trace-id.middleware';
import { RateLimitConfig } from '@core/config/rate-limit.config';

// ── Mocks a nivel de módulo ────────────────────────────────────────────────
// RateLimitConfig.createLimiter abre una conexión ioredis real — en este test unitario de
// wiring de rutas no queremos ni necesitamos Redis, solo verificar qué RouteInfo recibe cada
// limitador vía forRoutes.
const mockAuthLimiter = jest.fn();
const mockUploadLimiter = jest.fn();
const mockPaymentLimiter = jest.fn();
const mockSearchLimiter = jest.fn();
const mockGeneralLimiter = jest.fn();

jest.mock('@core/config/rate-limit.config', () => ({
  RateLimitConfig: { createLimiter: jest.fn() },
}));

const mockConfigService = {} as ConfigService;

// ── Helper: MiddlewareConsumer falso que registra cada `apply(...).forRoutes(...)` ─────────
interface RecordedApply {
  middleware: unknown;
  routes: unknown[];
}

function buildFakeConsumer(): {
  consumer: MiddlewareConsumer;
  calls: RecordedApply[];
} {
  const calls: RecordedApply[] = [];
  const consumer = {
    apply: jest.fn((middleware: unknown) => {
      const call: RecordedApply = { middleware, routes: [] };
      calls.push(call);
      return {
        forRoutes: jest.fn((...routes: unknown[]) => {
          call.routes = routes;
        }),
      };
    }),
  } as unknown as MiddlewareConsumer;
  return { consumer, calls };
}

describe('AppModule', () => {
  let appModule: AppModule;

  beforeEach(() => {
    jest.clearAllMocks();
    (RateLimitConfig.createLimiter as jest.Mock).mockReturnValue({
      general: mockGeneralLimiter,
      auth: mockAuthLimiter,
      upload: mockUploadLimiter,
      payment: mockPaymentLimiter,
      search: mockSearchLimiter,
    });
    appModule = new AppModule(mockConfigService);
  });

  describe('configure', () => {
    it('debe aplicar TraceIdMiddleware a todas las rutas', () => {
      // Arrange
      const { consumer, calls } = buildFakeConsumer();

      // Act
      appModule.configure(consumer);

      // Assert
      const traceCall = calls.find((c) => c.middleware === TraceIdMiddleware);
      expect(traceCall).toBeDefined();
      expect(traceCall?.routes).toEqual(['*']);
    });

    it('debe aplicar el limitador auth a login, nonce, refresh-token y recuperación de contraseña', () => {
      // Arrange
      const { consumer, calls } = buildFakeConsumer();

      // Act
      appModule.configure(consumer);

      // Assert
      const authCall = calls.find((c) => c.middleware === mockAuthLimiter);
      expect(authCall).toBeDefined();
      expect(authCall?.routes).toEqual(
        expect.arrayContaining([
          { path: 'auth/login', method: RequestMethod.POST, version: '1' },
          { path: 'auth/nonce', method: RequestMethod.POST, version: '1' },
          {
            path: 'auth/refresh-token',
            method: RequestMethod.POST,
            version: '1',
          },
          {
            path: 'auth/forgot-password',
            method: RequestMethod.PUT,
            version: '1',
          },
        ]),
      );
    });

    it('debe aplicar el limitador payment solo a las rutas que mutan (no a lecturas)', () => {
      // Arrange
      const { consumer, calls } = buildFakeConsumer();

      // Act
      appModule.configure(consumer);

      // Assert
      const paymentCall = calls.find(
        (c) => c.middleware === mockPaymentLimiter,
      );
      expect(paymentCall).toBeDefined();
      expect(paymentCall?.routes).toEqual(
        expect.arrayContaining([
          { path: 'payments', method: RequestMethod.POST },
          { path: 'payments/:id', method: RequestMethod.PUT },
          { path: 'payments/:id/cancel', method: RequestMethod.POST },
          { path: 'payments/:id/refund', method: RequestMethod.POST },
        ]),
      );
      expect(paymentCall?.routes).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ method: RequestMethod.GET }),
        ]),
      );
    });

    it('debe aplicar el limitador upload a uploads/* y a los endpoints multipart de documentos/portafolio', () => {
      // Arrange
      const { consumer, calls } = buildFakeConsumer();

      // Act
      appModule.configure(consumer);

      // Assert
      const uploadCall = calls.find((c) => c.middleware === mockUploadLimiter);
      expect(uploadCall).toBeDefined();
      expect(uploadCall?.routes).toEqual(
        expect.arrayContaining([
          { path: 'uploads/image', method: RequestMethod.POST },
          {
            path: 'professionals/me/documents',
            method: RequestMethod.POST,
          },
          { path: 'professionals/me/portfolio', method: RequestMethod.POST },
        ]),
      );
    });

    it('debe aplicar el limitador search a locations/nearby', () => {
      // Arrange
      const { consumer, calls } = buildFakeConsumer();

      // Act
      appModule.configure(consumer);

      // Assert
      const searchCall = calls.find((c) => c.middleware === mockSearchLimiter);
      expect(searchCall).toBeDefined();
      expect(searchCall?.routes).toEqual([
        { path: 'locations/nearby', method: RequestMethod.GET },
      ]);
    });

    it('no debe aplicar el limitador general a ninguna ruta específica (queda global en middleware.config.ts)', () => {
      // Arrange
      const { consumer, calls } = buildFakeConsumer();

      // Act
      appModule.configure(consumer);

      // Assert
      const generalCall = calls.find(
        (c) => c.middleware === mockGeneralLimiter,
      );
      expect(generalCall).toBeUndefined();
    });
  });
});
