import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { Prisma, UserStatus, UserProfileStatus, Users } from '@prisma/client';

import { OnboardingService } from './onboarding.service';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { AuthPasswordService } from '@modules/auth/services/auth-password.service';
import { EmailService } from '@modules/email/services/email.service';
import { EmailTypeEnum } from '@modules/email/enum/email-type.enum';
import { PrismaErrorCodes } from '@common/enum/prisma-error-codes.enum';

// ─── Mocks de dependencias ────────────────────────────────────────────────────

const mockUsersCreate = jest.fn();
const mockCreateOrUpdatePassword = jest.fn();
const mockSendEmailByType = jest.fn();

// ─── Fixture de usuario creado ────────────────────────────────────────────────

const createdUser = {
  id: 1,
  referenceId: 'ref-new-001',
  email: 'nuevo@test.com',
  firstName: 'Luis',
  lastName: 'Rodriguez',
  status: UserStatus.PENDING_VERIFICATION,
  profileStatus: UserProfileStatus.DOCUMENT_PENDING,
  isEmployee: false,
  isLdap: false,
  phoneNumber: '+595 981 000 000',
  documentNumber: null,
  documentTypeId: 1,
  accessLevelId: null,
  lastLogin: null,
  acceptedTermsAt: new Date(),
  unverifiedEmail: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'nuevo@test.com',
  lastChangedBy: null,
  lastChangedAt: null,
  changedReason: null,
} as unknown as Users;

const registerPayload = {
  firstName: 'Luis',
  lastName: 'Rodriguez',
  email: 'nuevo@test.com',
  phoneNumber: '+595 981 000 000',
  password: 'password_plano',
  acceptedTerms: true,
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: UsersDBService,
          useValue: {
            create: mockUsersCreate,
          },
        },
        {
          provide: AuthPasswordService,
          useValue: {
            createOrUpdatePassword: mockCreateOrUpdatePassword,
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmailByType: mockSendEmailByType,
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────────────────────────────────
  // registerUser
  // ──────────────────────────────────────────────────────────────────────────

  describe('registerUser', () => {
    it('debe registrar el usuario, crear contraseña y disparar email de verificación', async () => {
      // Arrange
      mockUsersCreate.mockResolvedValue(createdUser);
      mockCreateOrUpdatePassword.mockResolvedValue(undefined);
      mockSendEmailByType.mockResolvedValue(undefined);

      // Act
      const result = await service.registerUser(registerPayload);

      // Assert
      expect(result).toEqual(createdUser);
      expect(mockUsersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Luis',
          lastName: 'Rodriguez',
          email: 'nuevo@test.com',
          phoneNumber: '+595 981 000 000',
          status: UserStatus.PENDING_VERIFICATION,
          profileStatus: UserProfileStatus.DOCUMENT_PENDING,
          isEmployee: false,
          isLdap: false,
          createdBy: 'nuevo@test.com',
        }),
      );
      expect(mockCreateOrUpdatePassword).toHaveBeenCalledWith(
        1,
        'password_plano',
      );
    });

    it('debe disparar el email de verificación de forma asíncrona sin bloquear el flujo', async () => {
      // Arrange
      mockUsersCreate.mockResolvedValue(createdUser);
      mockCreateOrUpdatePassword.mockResolvedValue(undefined);
      // El email puede resolverse de forma diferida
      mockSendEmailByType.mockResolvedValue(undefined);

      // Act
      const result = await service.registerUser(registerPayload);

      // Assert: el resultado se retorna independientemente del email
      expect(result.id).toBe(1);
      // El email se invoca en void — puede que no sea awaited, así que verificamos con un pequeño flush
      await Promise.resolve();
      expect(mockSendEmailByType).toHaveBeenCalledWith(
        'nuevo@test.com',
        EmailTypeEnum.VERIFICATION,
        createdUser,
      );
    });

    it('debe registrar con acceptedTermsAt null cuando acceptedTerms es false', async () => {
      // Arrange
      mockUsersCreate.mockResolvedValue({
        ...createdUser,
        acceptedTermsAt: null,
      });
      mockCreateOrUpdatePassword.mockResolvedValue(undefined);
      mockSendEmailByType.mockResolvedValue(undefined);

      // Act
      await service.registerUser({ ...registerPayload, acceptedTerms: false });

      // Assert
      expect(mockUsersCreate).toHaveBeenCalledWith(
        expect.objectContaining({ acceptedTermsAt: null }),
      );
    });

    it('debe lanzar ConflictException cuando el email ya está registrado', async () => {
      // Arrange
      const prismaUniqueError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: PrismaErrorCodes.UniqueConstraintFailed,
          clientVersion: '5.0.0',
        },
      );
      mockUsersCreate.mockRejectedValue(prismaUniqueError);

      // Act & Assert
      await expect(service.registerUser(registerPayload)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe propagar errores no relacionados con unicidad sin transformarlos', async () => {
      // Arrange
      const genericError = new Error('DB connection lost');
      mockUsersCreate.mockRejectedValue(genericError);

      // Act & Assert
      await expect(service.registerUser(registerPayload)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });
});
