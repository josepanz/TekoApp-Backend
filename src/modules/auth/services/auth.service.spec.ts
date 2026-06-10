import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Users, UserProfileStatus, UserStatus } from '@prisma/client';

import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { AuthPasswordService } from './auth-password.service';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { UserCredentialsWithUser } from '@/modules/auth/types';

// ─── Mocks de UsersDBService ──────────────────────────────────────────────────

const mockFindCredentialsByEmail = jest.fn();
const mockFindActiveUserByEmail = jest.fn();
const mockUpdateLastLogin = jest.fn();
const mockGetUserRoles = jest.fn();
const mockGetUserPermissions = jest.fn();
const mockGetRolePermissions = jest.fn();
const mockVerifyUser = jest.fn();
const mockFindById = jest.fn();

// ─── Mocks de AuthPasswordService ────────────────────────────────────────────

const mockValidateEncryptedPassword = jest.fn();
const mockHandleFailedAttempt = jest.fn();
const mockResetFailedAttempts = jest.fn();
const mockCreateOrUpdateEncryptedPassword = jest.fn();
const mockChangeEncryptedPassword = jest.fn();
const mockDecryptPassword = jest.fn();
const mockCreateOrUpdatePassword = jest.fn();

// ─── Mocks de AuthTokenService ────────────────────────────────────────────────

const mockGenerateTokens = jest.fn();
const mockGenerateAccessTokenFromRefresh = jest.fn();

// ─── Fixtures ────────────────────────────────────────────────────────────────

function buildCredentials(
  statusOverride: UserStatus = UserStatus.ACTIVE,
  attemptsOverride = 0,
): UserCredentialsWithUser {
  return {
    id: 1,
    userId: 10,
    passwordHash: 'hashed',
    attempts: attemptsOverride,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    lastChangedBy: null,
    lastChangedAt: null,
    user: {
      id: 10,
      referenceId: 'ref-123',
      email: 'user@test.com',
      status: statusOverride,
      isEmployee: false,
      isLdap: false,
      firstName: 'Carlos',
      lastName: 'Gomez',
      phoneNumber: null,
      documentNumber: null,
      documentTypeId: 1,
      profileStatus: UserProfileStatus.COMPLETE,
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
      roles: [],
      permissions: [],
      credentials: [],
    },
  } as unknown as UserCredentialsWithUser;
}

function buildUser(statusOverride: UserStatus = UserStatus.ACTIVE): Users {
  return {
    id: 10,
    referenceId: 'ref-123',
    email: 'user@test.com',
    status: statusOverride,
    isEmployee: false,
    isLdap: false,
    firstName: 'Carlos',
    lastName: 'Gomez',
    phoneNumber: null,
    documentNumber: null,
    documentTypeId: 1,
    profileStatus: UserProfileStatus.COMPLETE,
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
  } as unknown as Users;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersDBService,
          useValue: {
            findCredentialsByEmail: mockFindCredentialsByEmail,
            findActiveUserByEmail: mockFindActiveUserByEmail,
            updateLastLogin: mockUpdateLastLogin,
            getUserRoles: mockGetUserRoles,
            getUserPermissions: mockGetUserPermissions,
            getRolePermissions: mockGetRolePermissions,
            verifyUser: mockVerifyUser,
            findById: mockFindById,
          },
        },
        {
          provide: AuthPasswordService,
          useValue: {
            validateEncryptedPassword: mockValidateEncryptedPassword,
            handleFailedAttempt: mockHandleFailedAttempt,
            resetFailedAttempts: mockResetFailedAttempts,
            createOrUpdateEncryptedPassword:
              mockCreateOrUpdateEncryptedPassword,
            changeEncryptedPassword: mockChangeEncryptedPassword,
            decryptPassword: mockDecryptPassword,
            createOrUpdatePassword: mockCreateOrUpdatePassword,
          },
        },
        {
          provide: AuthTokenService,
          useValue: {
            generateTokens: mockGenerateTokens,
            generateAccessTokenFromRefresh: mockGenerateAccessTokenFromRefresh,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────────────────────────────────
  // login
  // ──────────────────────────────────────────────────────────────────────────

  describe('login', () => {
    const loginPayload = {
      email: 'user@test.com',
      encryptedPassword: 'enc_pass',
      rembemberMe: false,
    };

    it('debe retornar tokens cuando el login es exitoso', async () => {
      // Arrange
      const credentials = buildCredentials();
      mockFindCredentialsByEmail.mockResolvedValue(credentials);
      mockValidateEncryptedPassword.mockReturnValue(true);
      mockResetFailedAttempts.mockResolvedValue(undefined);
      mockUpdateLastLogin.mockResolvedValue(undefined);
      mockGenerateTokens.mockReturnValue({
        accessToken: 'access_tok',
        refreshToken: 'refresh_tok',
      });

      // Act
      const result = await service.login(loginPayload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('access_tok');
      expect(result.refreshToken).toBe('refresh_tok');
      expect(result.requiresPasswordCreation).toBe(false);
    });

    it('debe retornar requiresPasswordCreation true cuando existe usuario pero sin credenciales', async () => {
      // Arrange
      mockFindCredentialsByEmail.mockResolvedValue(null);
      mockFindActiveUserByEmail.mockResolvedValue(buildUser());

      // Act
      const result = await service.login(loginPayload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.requiresPasswordCreation).toBe(true);
    });

    it('debe retornar success false cuando no hay credenciales ni usuario activo', async () => {
      // Arrange
      mockFindCredentialsByEmail.mockResolvedValue(null);
      mockFindActiveUserByEmail.mockResolvedValue(null);

      // Act
      const result = await service.login(loginPayload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.requiresPasswordCreation).toBe(false);
    });

    it('debe lanzar UnauthorizedException cuando la contraseña es incorrecta', async () => {
      // Arrange
      const credentials = buildCredentials();
      mockFindCredentialsByEmail.mockResolvedValue(credentials);
      mockValidateEncryptedPassword.mockReturnValue(false);
      mockHandleFailedAttempt.mockResolvedValue({ shouldBlock: false });

      // Act & Assert
      await expect(service.login(loginPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockHandleFailedAttempt).toHaveBeenCalledWith(credentials);
    });

    it('debe lanzar UnauthorizedException cuando el usuario está bloqueado', async () => {
      // Arrange
      const credentials = buildCredentials(UserStatus.BLOCKED);
      mockFindCredentialsByEmail.mockResolvedValue(credentials);

      // Act & Assert
      await expect(service.login(loginPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException cuando el usuario está eliminado', async () => {
      // Arrange
      const credentials = buildCredentials(UserStatus.DELETED);
      mockFindCredentialsByEmail.mockResolvedValue(credentials);

      // Act & Assert
      await expect(service.login(loginPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // createPassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('createPassword', () => {
    it('debe retornar success true cuando el usuario existe y la contraseña se crea', async () => {
      // Arrange
      mockFindActiveUserByEmail.mockResolvedValue(buildUser());
      mockCreateOrUpdateEncryptedPassword.mockResolvedValue(undefined);

      // Act
      const result = await service.createPassword({
        email: 'user@test.com',
        encryptedPassword: 'enc_pass',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateOrUpdateEncryptedPassword).toHaveBeenCalledWith(
        10,
        'enc_pass',
      );
    });

    it('debe lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockFindActiveUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createPassword({
          email: 'noexiste@test.com',
          encryptedPassword: 'enc',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // changePassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('changePassword', () => {
    const changePayload = {
      email: 'user@test.com',
      encryptedOldPassword: 'enc_old',
      encryptedNewPassword: 'enc_new',
    };

    it('debe retornar success true cuando el cambio de contraseña es exitoso', async () => {
      // Arrange
      mockFindActiveUserByEmail.mockResolvedValue(buildUser());
      mockFindCredentialsByEmail.mockResolvedValue(buildCredentials());
      mockChangeEncryptedPassword.mockResolvedValue(undefined);

      // Act
      const result = await service.changePassword(changePayload);

      // Assert
      expect(result.success).toBe(true);
      expect(mockChangeEncryptedPassword).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockFindActiveUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changePassword(changePayload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar NotFoundException cuando el usuario no tiene credenciales', async () => {
      // Arrange
      mockFindActiveUserByEmail.mockResolvedValue(buildUser());
      mockFindCredentialsByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changePassword(changePayload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // resetPassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('debe resetear la contraseña cuando las contraseñas nuevas coinciden', async () => {
      // Arrange
      mockDecryptPassword
        .mockReturnValueOnce('newpass')
        .mockReturnValueOnce('newpass');
      mockFindActiveUserByEmail.mockResolvedValue(buildUser());
      mockFindCredentialsByEmail.mockResolvedValue(buildCredentials());
      mockCreateOrUpdatePassword.mockResolvedValue(undefined);

      // Act
      const result = await service.resetPassword({
        email: 'user@test.com',
        encryptedNewPassword: 'enc_new',
        encryptedConfirmPassword: 'enc_confirm',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateOrUpdatePassword).toHaveBeenCalledWith(10, 'newpass');
    });

    it('debe lanzar UnauthorizedException cuando las contraseñas nuevas no coinciden', async () => {
      // Arrange
      mockDecryptPassword
        .mockReturnValueOnce('newpass1')
        .mockReturnValueOnce('newpass2');

      // Act & Assert
      await expect(
        service.resetPassword({
          email: 'user@test.com',
          encryptedNewPassword: 'enc_new',
          encryptedConfirmPassword: 'enc_confirm_wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockDecryptPassword.mockReturnValue('same_pass');
      mockFindActiveUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.resetPassword({
          email: 'noexiste@test.com',
          encryptedNewPassword: 'enc',
          encryptedConfirmPassword: 'enc',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // refreshAccessToken
  // ──────────────────────────────────────────────────────────────────────────

  describe('refreshAccessToken', () => {
    it('debe retornar un nuevo accessToken cuando el refresh token es válido', async () => {
      // Arrange
      mockGenerateAccessTokenFromRefresh.mockResolvedValue('new_access_tok');

      // Act
      const result = await service.refreshAccessToken('refresh_tok');

      // Assert
      expect(result.accessToken).toBe('new_access_tok');
      expect(mockGenerateAccessTokenFromRefresh).toHaveBeenCalledWith(
        'refresh_tok',
      );
    });

    it('debe propagar UnauthorizedException si el refresh token es inválido', async () => {
      // Arrange
      mockGenerateAccessTokenFromRefresh.mockRejectedValue(
        new UnauthorizedException('Token inválido'),
      );

      // Act & Assert
      await expect(service.refreshAccessToken('bad_tok')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // getUserScope
  // ──────────────────────────────────────────────────────────────────────────

  describe('getUserScope', () => {
    it('debe retornar roles y permisos únicos del usuario', async () => {
      // Arrange
      mockGetUserRoles.mockResolvedValue([
        { id: 1, name: 'ADMIN', description: 'Administrador' },
      ]);
      mockGetUserPermissions.mockResolvedValue([{ name: 'users:read' }]);
      mockGetRolePermissions.mockResolvedValue([
        { name: 'users:read' },
        { name: 'users:write' },
      ]);

      // Act
      const result = await service.getUserScope(10);

      // Assert
      expect(result.roles).toEqual([
        { name: 'ADMIN', description: 'Administrador' },
      ]);
      // users:read duplicado debe deduplicarse
      expect(result.permissions).toHaveLength(2);
      expect(result.permissions.map((p) => p.name)).toContain('users:read');
      expect(result.permissions.map((p) => p.name)).toContain('users:write');
    });

    it('debe retornar permisos vacíos cuando el usuario no tiene roles ni permisos', async () => {
      // Arrange
      mockGetUserRoles.mockResolvedValue([]);
      mockGetUserPermissions.mockResolvedValue([]);
      mockGetRolePermissions.mockResolvedValue([]);

      // Act
      const result = await service.getUserScope(10);

      // Assert
      expect(result.roles).toHaveLength(0);
      expect(result.permissions).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // verifyUser
  // ──────────────────────────────────────────────────────────────────────────

  describe('verifyUser', () => {
    it('debe delegar la verificación al repositorio de usuarios', async () => {
      // Arrange
      mockVerifyUser.mockResolvedValue(undefined);

      // Act
      await service.verifyUser(10);

      // Assert
      expect(mockVerifyUser).toHaveBeenCalledWith(10);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // checkVerificationStatus
  // ──────────────────────────────────────────────────────────────────────────

  describe('checkVerificationStatus', () => {
    it('debe retornar verified true cuando el usuario está activo', async () => {
      // Arrange
      mockFindById.mockResolvedValue(buildUser(UserStatus.ACTIVE));
      const user = buildUser();

      // Act
      const result = await service.checkVerificationStatus(user);

      // Assert
      expect(result.verified).toBe(true);
      expect(result.email).toBe('user@test.com');
    });

    it('debe retornar verified false cuando el usuario está pendiente de verificación', async () => {
      // Arrange
      mockFindById.mockResolvedValue(
        buildUser(UserStatus.PENDING_VERIFICATION),
      );
      const user = buildUser();

      // Act
      const result = await service.checkVerificationStatus(user);

      // Assert
      expect(result.verified).toBe(false);
    });

    it('debe retornar verified false cuando el usuario no existe en DB', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);
      const user = buildUser();

      // Act
      const result = await service.checkVerificationStatus(user);

      // Assert
      expect(result.verified).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // validateUser
  // ──────────────────────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('debe retornar las credenciales cuando el usuario y la contraseña son válidos', async () => {
      // Arrange
      const credentials = buildCredentials();
      mockFindCredentialsByEmail.mockResolvedValue(credentials);
      mockValidateEncryptedPassword.mockReturnValue(true);

      // Act
      const result = await service.validateUser('user@test.com', 'enc_pass');

      // Assert
      expect(result).toBe(credentials);
    });

    it('debe lanzar UnauthorizedException cuando no se encuentran credenciales', async () => {
      // Arrange
      mockFindCredentialsByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.validateUser('noexiste@test.com', 'enc_pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException cuando la contraseña es incorrecta', async () => {
      // Arrange
      const credentials = buildCredentials();
      mockFindCredentialsByEmail.mockResolvedValue(credentials);
      mockValidateEncryptedPassword.mockReturnValue(false);
      mockHandleFailedAttempt.mockResolvedValue({ shouldBlock: false });

      // Act & Assert
      await expect(
        service.validateUser('user@test.com', 'wrong_pass'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockHandleFailedAttempt).toHaveBeenCalledWith(credentials);
    });

    it('debe lanzar UnauthorizedException cuando el usuario está bloqueado', async () => {
      // Arrange
      const credentials = buildCredentials(UserStatus.BLOCKED);
      mockFindCredentialsByEmail.mockResolvedValue(credentials);

      // Act & Assert
      await expect(
        service.validateUser('user@test.com', 'enc_pass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
