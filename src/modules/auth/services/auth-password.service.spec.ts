import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserProfileStatus, UserStatus } from '@prisma/client';

import { AuthPasswordService } from './auth-password.service';
import { CryptoHelper } from '@common/helpers/crypto-helpers';
import { CredentialsRepository } from '@modules/auth/repositories';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { UserCredentialsWithUser } from '@modules/auth/types';
import { APP_CONFIG } from '@core/config/config-loader';

// Contraseña de prueba que SÍ cumple la política de complejidad real
// (PasswordPolicyHelper no está mockeado, corre su regex de verdad).
const VALID_PASSWORD = 'NewPass1!';

// Límite de histórico de contraseñas usado en los tests (coincide con el mock de config).
const HISTORY_LIMIT = 5;

// ─── Mocks de dependencias ────────────────────────────────────────────────────

const mockUpdateAttempts = jest.fn();
const mockFindByUserId = jest.fn();
const mockFindRecentByUserId = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRotatePassword = jest.fn();

const mockUpdateStatus = jest.fn();

// Config mockeada: expiración indefinida (0) e histórico de 5 por defecto.
const mockConfig = {
  authentication: {
    passwordExpirationDays: 0,
    passwordHistoryLimit: HISTORY_LIMIT,
  },
};

// ─── Mock de CryptoHelper (estático) ─────────────────────────────────────────

jest.mock('@common/helpers/crypto-helpers', () => ({
  CryptoHelper: {
    decrypt: jest.fn(),
    compareHashes: jest.fn(),
    hashValue: jest.fn(),
    initConfigService: jest.fn(),
  },
}));

// ─── Helpers para construir fixtures ─────────────────────────────────────────

function buildCredentials(
  overrides: Partial<UserCredentialsWithUser> = {},
): UserCredentialsWithUser {
  return {
    id: 1,
    userId: 10,
    passwordHash: 'hashed_pass',
    attempts: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    lastChangedBy: null,
    lastChangedAt: null,
    user: {
      id: 10,
      email: 'user@test.com',
      status: UserStatus.ACTIVE,
      firstName: 'Juan',
      lastName: 'Perez',
      referenceId: 'ref-123',
      isEmployee: false,
      isLdap: false,
      phoneNumber: null,
      documentNumber: null,
      documentTypeId: 1,
      profileStatus: UserProfileStatus.COMPLETE,
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
      roles: [],
      permissions: [],
      credentials: [],
    },
    ...overrides,
  } as unknown as UserCredentialsWithUser;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AuthPasswordService', () => {
  let service: AuthPasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthPasswordService,
        {
          provide: CredentialsRepository,
          useValue: {
            updateAttempts: mockUpdateAttempts,
            findByUserId: mockFindByUserId,
            findRecentByUserId: mockFindRecentByUserId,
            create: mockCreate,
            update: mockUpdate,
            rotatePassword: mockRotatePassword,
          },
        },
        {
          provide: UsersDBService,
          useValue: {
            updateStatus: mockUpdateStatus,
          },
        },
        {
          provide: APP_CONFIG.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<AuthPasswordService>(AuthPasswordService);
  });

  beforeEach(() => {
    // Por defecto no hay historial: el chequeo de reuso no bloquea.
    mockFindRecentByUserId.mockResolvedValue([]);
    mockConfig.authentication.passwordExpirationDays = 0;
    mockConfig.authentication.passwordHistoryLimit = HISTORY_LIMIT;
  });

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────────────────────────────────
  // decryptPassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('decryptPassword', () => {
    it('debe retornar la contraseña en texto plano cuando la desencriptación es exitosa', () => {
      // Arrange
      const fakeBuffer = Buffer.from('plain_password', 'utf-8');
      (CryptoHelper.decrypt as jest.Mock).mockReturnValue(fakeBuffer);

      // Act
      const result = service.decryptPassword('encrypted_value');

      // Assert
      expect(result).toBe('plain_password');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.decrypt).toHaveBeenCalledWith(
        'encrypted_value',
        'sha256',
      );
    });

    it('debe lanzar UnauthorizedException cuando la desencriptación falla', () => {
      // Arrange
      (CryptoHelper.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('RSA error');
      });

      // Act & Assert
      expect(() => service.decryptPassword('bad_encrypted')).toThrow(
        UnauthorizedException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // validatePassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('validatePassword', () => {
    it('debe retornar true cuando la contraseña coincide con el hash', () => {
      // Arrange
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(true);

      // Act
      const result = service.validatePassword('plain', 'hash');

      // Assert
      expect(result).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.compareHashes).toHaveBeenCalledWith('plain', 'hash');
    });

    it('debe retornar false cuando la contraseña no coincide con el hash', () => {
      // Arrange
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(false);

      // Act
      const result = service.validatePassword('wrong', 'hash');

      // Assert
      expect(result).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // validateEncryptedPassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('validateEncryptedPassword', () => {
    it('debe desencriptar y luego validar la contraseña correctamente', () => {
      // Arrange
      (CryptoHelper.decrypt as jest.Mock).mockReturnValue(Buffer.from('plain'));
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(true);

      // Act
      const result = service.validateEncryptedPassword('encrypted', 'hash');

      // Assert
      expect(result).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.decrypt).toHaveBeenCalledWith('encrypted', 'sha256');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.compareHashes).toHaveBeenCalledWith('plain', 'hash');
    });

    it('debe lanzar UnauthorizedException si la desencriptación falla', () => {
      // Arrange
      (CryptoHelper.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('decrypt error');
      });

      // Act & Assert
      expect(() => service.validateEncryptedPassword('bad', 'hash')).toThrow(
        UnauthorizedException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // hashPassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('hashPassword', () => {
    it('debe retornar el hash de la contraseña proporcionada', () => {
      // Arrange
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('bcrypt_hash');

      // Act
      const result = service.hashPassword('plaintext');

      // Assert
      expect(result).toBe('bcrypt_hash');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.hashValue).toHaveBeenCalledWith('plaintext');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // handleFailedAttempt
  // ──────────────────────────────────────────────────────────────────────────

  describe('handleFailedAttempt', () => {
    it('debe incrementar los intentos y no bloquear si son 3 o menos', async () => {
      // Arrange
      const credentials = buildCredentials({ attempts: 2 });
      mockUpdateAttempts.mockResolvedValue(undefined);

      // Act
      const result = await service.handleFailedAttempt(credentials);

      // Assert
      expect(result.shouldBlock).toBe(false);
      expect(mockUpdateAttempts).toHaveBeenCalledWith(1, 3);
      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it('debe bloquear al usuario cuando los intentos superan 3', async () => {
      // Arrange
      const credentials = buildCredentials({ attempts: 3 });
      mockUpdateAttempts.mockResolvedValue(undefined);
      mockUpdateStatus.mockResolvedValue(undefined);

      // Act
      const result = await service.handleFailedAttempt(credentials);

      // Assert
      expect(result.shouldBlock).toBe(true);
      expect(mockUpdateStatus).toHaveBeenCalledWith(10, UserStatus.BLOCKED);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // resetFailedAttempts
  // ──────────────────────────────────────────────────────────────────────────

  describe('resetFailedAttempts', () => {
    it('debe resetear los intentos a 0 cuando hay intentos fallidos previos', async () => {
      // Arrange
      const credentials = buildCredentials({ attempts: 2 });
      mockUpdateAttempts.mockResolvedValue(undefined);

      // Act
      await service.resetFailedAttempts(credentials);

      // Assert
      expect(mockUpdateAttempts).toHaveBeenCalledWith(1, 0);
    });

    it('no debe llamar a updateAttempts si los intentos ya son 0', async () => {
      // Arrange
      const credentials = buildCredentials({ attempts: 0 });

      // Act
      await service.resetFailedAttempts(credentials);

      // Assert
      expect(mockUpdateAttempts).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // createOrUpdatePassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('createOrUpdatePassword', () => {
    it('debe rotar la contraseña (insertar histórico) cuando la nueva cumple la complejidad', async () => {
      // Arrange
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hash');
      mockRotatePassword.mockResolvedValue(undefined);

      // Act
      await service.createOrUpdatePassword(10, VALID_PASSWORD);

      // Assert
      expect(mockRotatePassword).toHaveBeenCalledWith(10, 'new_hash', null);
    });

    it('debe lanzar BadRequestException y no rotar cuando la contraseña no cumple la complejidad', async () => {
      // Arrange
      const weakPassword = 'abc';

      // Act & Assert
      await expect(
        service.createOrUpdatePassword(10, weakPassword),
      ).rejects.toThrow(BadRequestException);
      expect(mockRotatePassword).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // createOrUpdateEncryptedPassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('createOrUpdateEncryptedPassword', () => {
    it('debe desencriptar y delegar en createOrUpdatePassword', async () => {
      // Arrange
      (CryptoHelper.decrypt as jest.Mock).mockReturnValue(
        Buffer.from(VALID_PASSWORD),
      );
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('hashed');
      mockRotatePassword.mockResolvedValue(undefined);

      // Act
      await service.createOrUpdateEncryptedPassword(10, 'encrypted_pass');

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.decrypt).toHaveBeenCalledWith(
        'encrypted_pass',
        'sha256',
      );
      expect(mockRotatePassword).toHaveBeenCalledWith(10, 'hashed', null);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // decryptLoginPayload
  // ──────────────────────────────────────────────────────────────────────────

  describe('decryptLoginPayload', () => {
    it('debe retornar password y nonce cuando el JSON desencriptado es válido', () => {
      // Arrange
      (CryptoHelper.decrypt as jest.Mock).mockReturnValue(
        Buffer.from(JSON.stringify({ password: 'secret', nonce: 'abc123' })),
      );

      // Act
      const result = service.decryptLoginPayload('enc');

      // Assert
      expect(result).toEqual({ password: 'secret', nonce: 'abc123' });
    });

    it('debe lanzar UnauthorizedException cuando el contenido no es JSON', () => {
      // Arrange
      (CryptoHelper.decrypt as jest.Mock).mockReturnValue(
        Buffer.from('no-es-json'),
      );

      // Act & Assert
      expect(() => service.decryptLoginPayload('enc')).toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException cuando falta el nonce en el JSON', () => {
      // Arrange
      (CryptoHelper.decrypt as jest.Mock).mockReturnValue(
        Buffer.from(JSON.stringify({ password: 'secret' })),
      );

      // Act & Assert
      expect(() => service.decryptLoginPayload('enc')).toThrow(
        UnauthorizedException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // changePassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('debe rotar la contraseña cuando la anterior es válida y la nueva cumple complejidad', async () => {
      // Arrange
      const credentials = buildCredentials({
        id: 1,
        userId: 10,
        passwordHash: 'old_hash',
      });
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(true);
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hash');
      mockRotatePassword.mockResolvedValue(undefined);

      // Act
      await service.changePassword(credentials, 'old_pass', VALID_PASSWORD);

      // Assert
      expect(mockRotatePassword).toHaveBeenCalledWith(10, 'new_hash', null);
    });

    it('debe lanzar UnauthorizedException cuando la contraseña anterior es incorrecta', async () => {
      // Arrange
      const credentials = buildCredentials({ passwordHash: 'hash' });
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(
        service.changePassword(credentials, 'wrong_old', VALID_PASSWORD),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockRotatePassword).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando la nueva contraseña no cumple complejidad', async () => {
      // Arrange
      const credentials = buildCredentials({ passwordHash: 'old_hash' });
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(true);

      // Act & Assert
      await expect(
        service.changePassword(credentials, 'old_pass', 'weak'),
      ).rejects.toThrow(BadRequestException);
      expect(mockRotatePassword).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // changeEncryptedPassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('changeEncryptedPassword', () => {
    it('debe desencriptar ambas contraseñas y delegar el cambio', async () => {
      // Arrange
      const credentials = buildCredentials({
        id: 1,
        userId: 10,
        passwordHash: 'old_hash',
      });
      (CryptoHelper.decrypt as jest.Mock)
        .mockReturnValueOnce(Buffer.from('old_plain'))
        .mockReturnValueOnce(Buffer.from(VALID_PASSWORD));
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(true);
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hashed');
      mockRotatePassword.mockResolvedValue(undefined);

      // Act
      await service.changeEncryptedPassword(credentials, 'enc_old', 'enc_new');

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.decrypt).toHaveBeenCalledTimes(2);
      expect(mockRotatePassword).toHaveBeenCalledWith(10, 'new_hashed', null);
    });

    it('debe propagar UnauthorizedException si la contraseña anterior desencriptada no coincide', async () => {
      // Arrange
      const credentials = buildCredentials({ passwordHash: 'hash' });
      (CryptoHelper.decrypt as jest.Mock)
        .mockReturnValueOnce(Buffer.from('old_plain'))
        .mockReturnValueOnce(Buffer.from(VALID_PASSWORD));
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(
        service.changeEncryptedPassword(credentials, 'enc_old', 'enc_new'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Prevención de reuso de contraseñas (histórico)
  // ──────────────────────────────────────────────────────────────────────────

  describe('prevención de reuso de contraseñas', () => {
    it('debe lanzar BadRequestException y no rotar cuando la nueva coincide con alguna del histórico', async () => {
      // Arrange
      mockFindRecentByUserId.mockResolvedValue([
        { passwordHash: 'hash_historico_1' },
        { passwordHash: 'hash_historico_2' },
      ]);
      // Coincide con alguna del histórico.
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(true);

      // Act & Assert
      await expect(
        service.createOrUpdatePassword(10, VALID_PASSWORD),
      ).rejects.toThrow(BadRequestException);
      expect(mockFindRecentByUserId).toHaveBeenCalledWith(10, HISTORY_LIMIT);
      expect(mockRotatePassword).not.toHaveBeenCalled();
    });

    it('debe rotar cuando la nueva no coincide con ninguna del histórico', async () => {
      // Arrange
      mockFindRecentByUserId.mockResolvedValue([
        { passwordHash: 'hash_historico_1' },
      ]);
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(false);
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hash');
      mockRotatePassword.mockResolvedValue(undefined);

      // Act
      await service.createOrUpdatePassword(10, VALID_PASSWORD);

      // Assert
      expect(mockRotatePassword).toHaveBeenCalledWith(10, 'new_hash', null);
    });

    it('no debe bloquear en el flujo de primera contraseña (sin historial previo)', async () => {
      // Arrange
      mockFindRecentByUserId.mockResolvedValue([]);
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hash');
      mockRotatePassword.mockResolvedValue(undefined);

      // Act
      await service.createOrUpdatePassword(10, VALID_PASSWORD);

      // Assert
      expect(mockRotatePassword).toHaveBeenCalledWith(10, 'new_hash', null);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Expiración configurable
  // ──────────────────────────────────────────────────────────────────────────

  describe('expiración configurable de contraseña', () => {
    it('debe rotar con expiredAt=null cuando PASSWORD_EXPIRATION_DAYS es 0 (indefinida)', async () => {
      // Arrange
      mockConfig.authentication.passwordExpirationDays = 0;
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hash');
      mockRotatePassword.mockResolvedValue(undefined);

      // Act
      await service.createOrUpdatePassword(10, VALID_PASSWORD);

      // Assert
      expect(mockRotatePassword).toHaveBeenCalledWith(10, 'new_hash', null);
    });

    it('debe rotar con expiredAt calculado cuando PASSWORD_EXPIRATION_DAYS es > 0', async () => {
      // Arrange
      mockConfig.authentication.passwordExpirationDays = 30;
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hash');
      mockRotatePassword.mockResolvedValue(undefined);
      const before = Date.now();

      // Act
      await service.createOrUpdatePassword(10, VALID_PASSWORD);

      // Assert
      const [userIdArg, hashArg, expiredAtArg] = mockRotatePassword.mock
        .calls[0] as [number, string, Date | null];
      expect(userIdArg).toBe(10);
      expect(hashArg).toBe('new_hash');
      expect(expiredAtArg).toBeInstanceOf(Date);
      const expectedMin = before + 30 * 24 * 60 * 60 * 1000;
      expect(expiredAtArg.getTime()).toBeGreaterThanOrEqual(expectedMin);
    });
  });
});
