import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus, Users } from '@prisma/client';

import { EmailService } from './email.service';
import { CryptoHelper } from '@common/helpers/crypto-helpers';
import { EmailHelper } from '@modules/email/helpers/email.helper';
import { APP_CONFIG } from '@core/config/config-loader';
import { EmailTypeEnum } from '@modules/email/enum/email-type.enum';

// ─── Mocks de nodemailer ──────────────────────────────────────────────────────
// jest.mock() se hoistea — no referenciar variables const externas dentro de la factory

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

let mockSendMail: jest.Mock;

// Referencia enlazada aparte: evita @typescript-eslint/unbound-method al pasar el mock
// directamente a `expect(...)` — prettier envuelve `EmailHelper.createGenericNotificationTemplate`
// en su propia línea cuando el nombre es largo, y el eslint-disable-next-line ya no cae sobre la
// línea correcta.
const genericTemplateMock = (
  EmailHelper as unknown as { createGenericNotificationTemplate: jest.Mock }
).createGenericNotificationTemplate;

// ─── Mocks de CryptoHelper ────────────────────────────────────────────────────

jest.mock('@common/helpers/crypto-helpers', () => ({
  CryptoHelper: {
    generateToken: jest.fn(),
    initConfigService: jest.fn(),
  },
}));

// ─── Mocks de EmailHelper ─────────────────────────────────────────────────────

jest.mock('@modules/email/helpers/email.helper', () => ({
  EmailHelper: {
    createUserVerificationTemplate: jest
      .fn()
      .mockReturnValue('<html>verification</html>'),
    createUserForgotPasswordTemplate: jest
      .fn()
      .mockReturnValue('<html>forgot</html>'),
    createPasswordCreationTemplate: jest
      .fn()
      .mockReturnValue('<html>create</html>'),
    createGenericNotificationTemplate: jest
      .fn()
      .mockReturnValue('<html>generic</html>'),
    createPaymentReceiptTemplate: jest
      .fn()
      .mockReturnValue('<html>receipt</html>'),
  },
}));

// ─── Config mock ──────────────────────────────────────────────────────────────

const mockAppConfig = {
  email: {
    host: 'smtp.test.com',
    port: 587,
    user: 'test@test.com',
    password: 'pass',
    dir: 'noreply@test.com',
  },
  authentication: {
    tempTokenExpires: '1h',
    privateKey: 'test-key',
    publicKey: 'pub-key',
    accessTokenExpires: '15m',
    refreshTokenExpires: '7d',
    shortRefreshTokenExpires: '12h',
  },
  baseUrl: 'http://localhost:3000',
};

// ─── Fixture de usuario ───────────────────────────────────────────────────────

function buildUser(overrides: Record<string, unknown> = {}): Users {
  return {
    id: 1,
    referenceId: 'ref-123',
    email: 'usuario@test.com',
    firstName: 'Maria',
    lastName: 'Perez',
    status: UserStatus.ACTIVE,
    isEmployee: false,
    isLdap: false,
    phoneNumber: null,
    documentNumber: null,
    documentTypeId: 1,
    profileStatus: 'COMPLETE',
    accessLevelId: null,
    lastLogin: null,
    acceptedTermsAt: null,
    unverifiedEmail: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    lastChangedBy: null,
    lastChangedAt: null,
    changedReason: null,
    ...overrides,
  } as unknown as Users;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    mockSendMail = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require('nodemailer') as { createTransport: jest.Mock };
    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: APP_CONFIG.KEY,
          useValue: mockAppConfig,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────────────────────────────────
  // initializeTransporter (se llama en constructor)
  // ──────────────────────────────────────────────────────────────────────────

  describe('inicialización del transporter', () => {
    it('debe crear el transporter de nodemailer al instanciar el servicio', () => {
      // Assert: El mock de createTransport fue llamado en el constructor
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer') as {
        createTransport: jest.Mock;
      };
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.test.com',
          port: 587,
          auth: expect.objectContaining({ user: 'test@test.com' }) as unknown,
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // send
  // ──────────────────────────────────────────────────────────────────────────

  describe('send', () => {
    it('debe enviar el correo correctamente cuando el transporter responde sin error', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'test-id-123' });

      // Act
      await service.send({
        to: 'dest@test.com',
        subject: 'Asunto de prueba',
        content: '<p>Contenido</p>',
      });

      // Assert
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'dest@test.com',
          subject: 'Asunto de prueba',
          html: '<p>Contenido</p>',
          from: expect.stringContaining('noreply@test.com') as unknown,
        }),
      );
    });

    it('debe lanzar InternalServerErrorException cuando el transporter falla', async () => {
      // Arrange
      mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

      // Act & Assert
      await expect(
        service.send({ to: 'dest@test.com', subject: 'Error', content: '' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendEmailByType — VERIFICATION
  // ──────────────────────────────────────────────────────────────────────────

  describe('sendEmailByType — VERIFICATION', () => {
    it('debe generar token y enviar email de verificación cuando el usuario existe', async () => {
      // Arrange
      (CryptoHelper.generateToken as jest.Mock).mockReturnValue('temp_token');
      mockSendMail.mockResolvedValue({ messageId: 'id-1' });
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.VERIFICATION,
        user,
      );

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.generateToken).toHaveBeenCalledWith(
        'tempToken',
        expect.objectContaining({ sub: '1', email: 'usuario@test.com' }),
        'RS256',
        '1h',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(EmailHelper.createUserVerificationTemplate).toHaveBeenCalledWith(
        'Maria Perez',
        expect.stringContaining('temp_token'),
      );
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException cuando no se proporciona usuario en VERIFICATION', async () => {
      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          EmailTypeEnum.VERIFICATION,
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendEmailByType — FORGOT_PASSWORD
  // ──────────────────────────────────────────────────────────────────────────

  describe('sendEmailByType — FORGOT_PASSWORD', () => {
    it('debe generar token y enviar email de recuperación de contraseña', async () => {
      // Arrange
      (CryptoHelper.generateToken as jest.Mock).mockReturnValue('forgot_token');
      mockSendMail.mockResolvedValue({ messageId: 'id-2' });
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.FORGOT_PASSWORD,
        user,
      );

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.generateToken).toHaveBeenCalledWith(
        'tempToken',
        expect.objectContaining({ action: 'forgotPassword' }),
        'RS256',
        '1h',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(EmailHelper.createUserForgotPasswordTemplate).toHaveBeenCalledWith(
        'Maria Perez',
        expect.stringContaining('forgot_token'),
      );
    });

    it('debe usar tokenExpiresOverride cuando se proporciona', async () => {
      // Arrange
      (CryptoHelper.generateToken as jest.Mock).mockReturnValue('tok');
      mockSendMail.mockResolvedValue({});
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.FORGOT_PASSWORD,
        user,
        '30m',
      );

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.generateToken).toHaveBeenCalledWith(
        'tempToken',
        expect.any(Object),
        'RS256',
        '30m',
      );
    });

    it('debe lanzar NotFoundException cuando no se proporciona usuario en FORGOT_PASSWORD', async () => {
      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          EmailTypeEnum.FORGOT_PASSWORD,
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendEmailByType — CREATE_PASSWORD
  // ──────────────────────────────────────────────────────────────────────────

  describe('sendEmailByType — CREATE_PASSWORD', () => {
    it('debe enviar email de creación de contraseña cuando el usuario existe', async () => {
      // Arrange
      (CryptoHelper.generateToken as jest.Mock).mockReturnValue('create_tok');
      mockSendMail.mockResolvedValue({});
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.CREATE_PASSWORD,
        user,
      );

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(EmailHelper.createPasswordCreationTemplate).toHaveBeenCalledWith(
        'Maria Perez',
        expect.stringContaining('create_tok'),
      );
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException cuando no se proporciona usuario en CREATE_PASSWORD', async () => {
      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          EmailTypeEnum.CREATE_PASSWORD,
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendEmailByType — LOGIN (tarea 6)
  // ──────────────────────────────────────────────────────────────────────────

  describe('sendEmailByType — LOGIN', () => {
    it('debe enviar el aviso de nuevo inicio de sesión cuando el usuario existe', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'id-login' });
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.LOGIN,
        user,
      );

      // Assert
      expect(genericTemplateMock).toHaveBeenCalledWith(
        'Maria Perez',
        'Nuevo inicio de sesión',
        expect.any(String),
      );
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException cuando no se proporciona usuario en LOGIN', async () => {
      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          EmailTypeEnum.LOGIN,
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendEmailByType — PASSWORD_CHANGED (tarea 6)
  // ──────────────────────────────────────────────────────────────────────────

  describe('sendEmailByType — PASSWORD_CHANGED', () => {
    it('debe enviar la confirmación de cambio de contraseña cuando el usuario existe', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'id-pwd-changed' });
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.PASSWORD_CHANGED,
        user,
      );

      // Assert
      expect(genericTemplateMock).toHaveBeenCalledWith(
        'Maria Perez',
        'Tu contraseña cambió',
        expect.any(String),
      );
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException cuando no se proporciona usuario en PASSWORD_CHANGED', async () => {
      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          EmailTypeEnum.PASSWORD_CHANGED,
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendEmailByType — PASSWORD_RESET (tarea 6)
  // ──────────────────────────────────────────────────────────────────────────

  describe('sendEmailByType — PASSWORD_RESET', () => {
    it('debe enviar la confirmación de restablecimiento cuando el usuario existe', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'id-pwd-reset' });
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.PASSWORD_RESET,
        user,
      );

      // Assert
      expect(genericTemplateMock).toHaveBeenCalledWith(
        'Maria Perez',
        'Tu contraseña fue restablecida',
        expect.any(String),
      );
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException cuando no se proporciona usuario en PASSWORD_RESET', async () => {
      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          EmailTypeEnum.PASSWORD_RESET,
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendEmailByType — PAYMENT_METHOD_CREATED (tarea 6)
  // ──────────────────────────────────────────────────────────────────────────

  describe('sendEmailByType — PAYMENT_METHOD_CREATED', () => {
    it('debe incluir el methodLabel en el mensaje cuando extraData.dto lo trae', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'id-method' });
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.PAYMENT_METHOD_CREATED,
        user,
        undefined,
        {
          dto: { methodLabel: 'Visa •••• 4242' },
          description: 'alta de método',
        },
      );

      // Assert
      expect(genericTemplateMock).toHaveBeenCalledWith(
        'Maria Perez',
        'Medio de pago agregado',
        expect.stringContaining('Visa •••• 4242'),
      );
    });

    it('debe usar un mensaje genérico cuando no viene methodLabel', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'id-method-2' });
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.PAYMENT_METHOD_CREATED,
        user,
      );

      // Assert
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException cuando no se proporciona usuario en PAYMENT_METHOD_CREATED', async () => {
      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          EmailTypeEnum.PAYMENT_METHOD_CREATED,
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendEmailByType — PAYMENT_RECEIPT (tarea 6 — plumbing lista, sin caller real aún)
  // ──────────────────────────────────────────────────────────────────────────

  describe('sendEmailByType — PAYMENT_RECEIPT', () => {
    const receiptData = {
      operationNumber: 'OP-1',
      authorizationCode: 'AUTH-1',
      merchantName: 'TekoApp',
      transactionDate: '2026-09-14',
      amount: 50000,
      paymentMethod: 'Visa •••• 4242',
      description: 'Servicio de plomería',
    };

    it('debe enviar el comprobante usando los datos de extraData.dto', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'id-receipt' });
      const user = buildUser();

      // Act
      await service.sendEmailByType(
        'usuario@test.com',
        EmailTypeEnum.PAYMENT_RECEIPT,
        user,
        undefined,
        { dto: receiptData, description: 'comprobante de pago' },
      );

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(EmailHelper.createPaymentReceiptTemplate).toHaveBeenCalledWith(
        receiptData.operationNumber,
        receiptData.authorizationCode,
        receiptData.merchantName,
        receiptData.transactionDate,
        receiptData.amount,
        receiptData.paymentMethod,
        receiptData.description,
      );
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('debe lanzar InternalServerErrorException cuando falta extraData.dto', async () => {
      // Arrange
      const user = buildUser();

      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          EmailTypeEnum.PAYMENT_RECEIPT,
          user,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('debe lanzar NotFoundException cuando no se proporciona usuario en PAYMENT_RECEIPT', async () => {
      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          EmailTypeEnum.PAYMENT_RECEIPT,
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendEmailByType — tipo desconocido
  // ──────────────────────────────────────────────────────────────────────────

  describe('sendEmailByType — tipo no reconocido', () => {
    it('debe lanzar InternalServerErrorException cuando el tipo de email no existe', async () => {
      // Act & Assert
      await expect(
        service.sendEmailByType(
          'usuario@test.com',
          'TIPO_INVALIDO' as EmailTypeEnum,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
