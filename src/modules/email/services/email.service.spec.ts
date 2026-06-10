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
    access_level: 0,
    accessLevelId: null,
    lastLogin: null,
    acceptedTermsAt: null,
    unverifiedEmail: null,
    legacyUserId: null,
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
