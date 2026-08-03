import { Test, TestingModule } from '@nestjs/testing';
import { FcmProviderService } from './fcm-provider.service';
import { APP_CONFIG } from '@core/config/config-loader';
import { PushSendOutcome } from '../interfaces/push-provider.interface';

const mockSend = jest.fn();
const mockMessaging = jest.fn(() => ({ send: mockSend }));
const mockInitializeApp = jest.fn((): { messaging: typeof mockMessaging } => ({
  messaging: mockMessaging,
}));
const mockCert = jest.fn((): Record<string, unknown> => ({}));

jest.mock('firebase-admin', () => ({
  initializeApp: (...args: unknown[]): ReturnType<typeof mockInitializeApp> =>
    mockInitializeApp(...args),
  credential: {
    cert: (...args: unknown[]): ReturnType<typeof mockCert> =>
      mockCert(...args),
  },
}));

const buildConfig = (overrides: Record<string, unknown> = {}) => ({
  firebase: {
    projectId: 'teko-app',
    privateKey: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
    clientEmail: 'firebase-adminsdk@teko-app.iam.gserviceaccount.com',
    ...overrides,
  },
});

const payload = {
  title: 'Título',
  message: 'Mensaje',
  referenceId: 'ref-1',
  type: 'SERVICE',
};

describe('FcmProviderService', () => {
  const buildService = async (config = buildConfig()) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FcmProviderService,
        { provide: APP_CONFIG.KEY, useValue: config },
      ],
    }).compile();

    return module.get<FcmProviderService>(FcmProviderService);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('inicialización', () => {
    it('inicializa Firebase Admin cuando las credenciales están completas', async () => {
      // Act
      await buildService();

      // Assert
      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    });

    it('no inicializa y degrada a FAILED si faltan credenciales', async () => {
      // Arrange
      const service = await buildService(
        buildConfig({ projectId: '', privateKey: '', clientEmail: '' }),
      );

      // Act
      const result = await service.send('token-abc', payload);

      // Assert
      expect(mockInitializeApp).not.toHaveBeenCalled();
      expect(result).toEqual({
        outcome: PushSendOutcome.FAILED,
        error: 'Firebase no configurado',
      });
    });

    it('degrada a FAILED si initializeApp lanza (credenciales inválidas, ej. placeholder de dev)', async () => {
      // Arrange
      mockInitializeApp.mockImplementationOnce(() => {
        throw new Error('Failed to parse private key');
      });
      const service = await buildService();

      // Act
      const result = await service.send('token-abc', payload);

      // Assert
      expect(result).toEqual({
        outcome: PushSendOutcome.FAILED,
        error: 'Firebase no configurado',
      });
    });
  });

  describe('send', () => {
    it('envía el mensaje y retorna SENT en el caso feliz', async () => {
      // Arrange
      const service = await buildService();
      mockSend.mockResolvedValue('projects/teko-app/messages/123');

      // Act
      const result = await service.send('token-abc', payload);

      // Assert
      expect(mockSend).toHaveBeenCalledWith({
        token: 'token-abc',
        notification: { title: payload.title, body: payload.message },
        data: { referenceId: payload.referenceId, type: payload.type },
      });
      expect(result).toEqual({ outcome: PushSendOutcome.SENT });
    });

    it('retorna GONE cuando el token ya no está registrado', async () => {
      // Arrange
      const service = await buildService();
      mockSend.mockRejectedValue({
        code: 'messaging/registration-token-not-registered',
      });

      // Act
      const result = await service.send('token-abc', payload);

      // Assert
      expect(result).toEqual({ outcome: PushSendOutcome.GONE });
    });

    it('retorna FAILED ante cualquier otro error', async () => {
      // Arrange
      const service = await buildService();
      mockSend.mockRejectedValue(new Error('quota exceeded'));

      // Act
      const result = await service.send('token-abc', payload);

      // Assert
      expect(result).toEqual({
        outcome: PushSendOutcome.FAILED,
        error: 'quota exceeded',
      });
    });
  });
});
