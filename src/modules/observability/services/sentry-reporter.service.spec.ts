import { Test, TestingModule } from '@nestjs/testing';
import * as Sentry from '@sentry/nestjs';
import { APP_CONFIG } from '@core/config/config-loader';
import { SentryReporterService } from './sentry-reporter.service';

jest.mock('@sentry/nestjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

const mockInit = Sentry.init as jest.MockedFunction<typeof Sentry.init>;
const mockCaptureException = Sentry.captureException as jest.MockedFunction<
  typeof Sentry.captureException
>;

function buildErrorEvent(
  type: string,
  value: string,
  filename = 'a.ts',
  lineno = 1,
): Sentry.ErrorEvent {
  return {
    exception: {
      values: [{ type, value, stacktrace: { frames: [{ filename, lineno }] } }],
    },
  } as unknown as Sentry.ErrorEvent;
}

async function buildService(
  glitchtipDsn: string | undefined,
): Promise<SentryReporterService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      SentryReporterService,
      {
        provide: APP_CONFIG.KEY,
        useValue: {
          env: 'local',
          project: { version: '1.0.0' },
          observability: { glitchtipDsn },
        },
      },
    ],
  }).compile();

  return module.get<SentryReporterService>(SentryReporterService);
}

describe('SentryReporterService', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('inicialización', () => {
    it('NO inicializa el SDK si GLITCHTIP_DSN no está configurado', async () => {
      // Arrange
      const service = await buildService(undefined);

      // Act
      service.onModuleInit();

      // Assert
      expect(mockInit).not.toHaveBeenCalled();
      expect(service.isInitialized()).toBe(false);
    });

    it('inicializa el SDK cuando GLITCHTIP_DSN está configurado', async () => {
      // Arrange
      const service = await buildService('https://glitchtip.example/1');

      // Act
      service.onModuleInit();

      // Assert
      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://glitchtip.example/1',
          tracesSampleRate: 0,
          sendDefaultPii: false,
        }),
      );
      expect(typeof mockInit.mock.calls[0]?.[0]?.beforeSend).toBe('function');
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('captureException', () => {
    it('no hace nada si el SDK no está inicializado (sin DSN)', async () => {
      // Arrange
      const service = await buildService(undefined);
      service.onModuleInit();

      // Act
      service.captureException(new Error('boom'), { route: '/x' });

      // Assert
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('sanitiza password/token/secretKey del body reusando formatPayload, sin escribir un scrubber nuevo', async () => {
      // Arrange
      const service = await buildService('https://glitchtip.example/1');
      service.onModuleInit();

      // Act
      service.captureException(new Error('boom'), {
        route: '/payments',
        method: 'POST',
        requestId: 'trace-1',
        userId: 42,
        body: { password: 'hunter2', token: 'abc', amount: 100 },
        query: { secretKey: 'shh', page: 1 },
      });

      // Assert
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      const captureOptions = mockCaptureException.mock
        .calls[0]?.[1] as unknown as {
        contexts: { request: Record<string, unknown> };
      };
      expect(captureOptions.contexts.request).toEqual({
        route: '/payments',
        method: 'POST',
        requestId: 'trace-1',
        userId: 42,
        body: {
          password: '***SANITIZED***',
          token: '***SANITIZED***',
          amount: 100,
        },
        query: { secretKey: '***SANITIZED***', page: 1 },
      });
    });

    it('no lanza si Sentry.captureException falla (no debe tumbar la respuesta de error real)', async () => {
      // Arrange
      const service = await buildService('https://glitchtip.example/1');
      service.onModuleInit();
      mockCaptureException.mockImplementation(() => {
        throw new Error('network down');
      });

      // Act & Assert
      expect(() => service.captureException(new Error('boom'))).not.toThrow();
    });
  });

  describe('beforeSend (deduplicación + muestreo)', () => {
    async function buildInitializedServiceAndBeforeSend() {
      const service = await buildService('https://glitchtip.example/1');
      service.onModuleInit();
      const options = mockInit.mock.calls[0]?.[0] as unknown as {
        beforeSend: (event: Sentry.ErrorEvent) => Sentry.ErrorEvent | null;
      };
      return options.beforeSend;
    }

    it('deja pasar la primera ocurrencia de un error', async () => {
      // Arrange
      const beforeSend = await buildInitializedServiceAndBeforeSend();
      const event = buildErrorEvent('TypeError', 'x is not a function');

      // Act
      const result = beforeSend(event);

      // Assert
      expect(result).toBe(event);
    });

    it('descarta un repetido dentro de la ventana de deduplicación', async () => {
      // Arrange
      const beforeSend = await buildInitializedServiceAndBeforeSend();
      const event = buildErrorEvent('TypeError', 'x is not a function');
      jest.spyOn(Date, 'now').mockReturnValue(1_000);
      beforeSend(event);

      // Act — mismo error 5s después (ventana es 60s)
      jest.spyOn(Date, 'now').mockReturnValue(6_000);
      const result = beforeSend(event);

      // Assert
      expect(result).toBeNull();
    });

    it('deja pasar un repetido fuera de la ventana solo si cae dentro del muestreo', async () => {
      // Arrange
      const beforeSend = await buildInitializedServiceAndBeforeSend();
      const event = buildErrorEvent('TypeError', 'x is not a function');
      jest.spyOn(Date, 'now').mockReturnValue(0);
      beforeSend(event);

      // Act — 61s después (fuera de la ventana de 60s), muestreo favorable (0.05 < 0.1)
      jest.spyOn(Date, 'now').mockReturnValue(61_000);
      jest.spyOn(Math, 'random').mockReturnValue(0.05);
      const sampledIn = beforeSend(event);

      // Assert
      expect(sampledIn).toBe(event);
    });

    it('descarta un repetido fuera de la ventana cuando el muestreo no lo selecciona', async () => {
      // Arrange
      const beforeSend = await buildInitializedServiceAndBeforeSend();
      const event = buildErrorEvent('TypeError', 'x is not a function');
      jest.spyOn(Date, 'now').mockReturnValue(0);
      beforeSend(event);

      // Act — fuera de la ventana, muestreo desfavorable (0.5 > 0.1)
      jest.spyOn(Date, 'now').mockReturnValue(61_000);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const sampledOut = beforeSend(event);

      // Assert
      expect(sampledOut).toBeNull();
    });

    it('trata fingerprints distintos (tipo/mensaje/frame distintos) como independientes', async () => {
      // Arrange
      const beforeSend = await buildInitializedServiceAndBeforeSend();
      const eventA = buildErrorEvent('TypeError', 'a');
      const eventB = buildErrorEvent('RangeError', 'b');
      jest.spyOn(Date, 'now').mockReturnValue(0);
      beforeSend(eventA);

      // Act
      const resultB = beforeSend(eventB);

      // Assert
      expect(resultB).toBe(eventB);
    });
  });
});
