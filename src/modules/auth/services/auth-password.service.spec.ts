import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UserProfileStatus, UserStatus } from '@prisma/client';

import { AuthPasswordService } from './auth-password.service';
import { CryptoHelper } from '@common/helpers/crypto-helpers';
import { CredentialsRepository } from '@modules/auth/repositories';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { UserCredentialsWithUser } from '@modules/auth/types';

// ─── Mocks de dependencias ────────────────────────────────────────────────────

const mockUpdateAttempts = jest.fn();
const mockFindByUserId = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

const mockUpdateStatus = jest.fn();

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
            create: mockCreate,
            update: mockUpdate,
          },
        },
        {
          provide: UsersDBService,
          useValue: {
            updateStatus: mockUpdateStatus,
          },
        },
      ],
    }).compile();

    service = module.get<AuthPasswordService>(AuthPasswordService);
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
    it('debe actualizar las credenciales existentes cuando ya existen para el usuario', async () => {
      // Arrange
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hash');
      mockFindByUserId.mockResolvedValue({ id: 5, passwordHash: 'old_hash' });
      mockUpdate.mockResolvedValue(undefined);

      // Act
      await service.createOrUpdatePassword(10, 'new_pass');

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(5, {
        passwordHash: 'new_hash',
        attempts: 0,
        isActive: true,
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe crear nuevas credenciales cuando el usuario no tiene contraseña previa', async () => {
      // Arrange
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('hash_nueva');
      mockFindByUserId.mockResolvedValue(null);
      mockCreate.mockResolvedValue(undefined);

      // Act
      await service.createOrUpdatePassword(10, 'pass');

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        userId: 10,
        passwordHash: 'hash_nueva',
        attempts: 0,
        isActive: true,
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // createOrUpdateEncryptedPassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('createOrUpdateEncryptedPassword', () => {
    it('debe desencriptar y delegar en createOrUpdatePassword', async () => {
      // Arrange
      (CryptoHelper.decrypt as jest.Mock).mockReturnValue(
        Buffer.from('plain_pass'),
      );
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('hashed');
      mockFindByUserId.mockResolvedValue(null);
      mockCreate.mockResolvedValue(undefined);

      // Act
      await service.createOrUpdateEncryptedPassword(10, 'encrypted_pass');

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.decrypt).toHaveBeenCalledWith(
        'encrypted_pass',
        'sha256',
      );
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // changePassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('debe actualizar el hash cuando la contraseña anterior es válida', async () => {
      // Arrange
      const credentials = buildCredentials({ id: 1, passwordHash: 'old_hash' });
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(true);
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hash');
      mockUpdate.mockResolvedValue(undefined);

      // Act
      await service.changePassword(credentials, 'old_pass', 'new_pass');

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        passwordHash: 'new_hash',
        attempts: 0,
      });
    });

    it('debe lanzar UnauthorizedException cuando la contraseña anterior es incorrecta', async () => {
      // Arrange
      const credentials = buildCredentials({ passwordHash: 'hash' });
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(
        service.changePassword(credentials, 'wrong_old', 'new_pass'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // changeEncryptedPassword
  // ──────────────────────────────────────────────────────────────────────────

  describe('changeEncryptedPassword', () => {
    it('debe desencriptar ambas contraseñas y delegar el cambio', async () => {
      // Arrange
      const credentials = buildCredentials({ id: 1, passwordHash: 'old_hash' });
      (CryptoHelper.decrypt as jest.Mock)
        .mockReturnValueOnce(Buffer.from('old_plain'))
        .mockReturnValueOnce(Buffer.from('new_plain'));
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(true);
      (CryptoHelper.hashValue as jest.Mock).mockReturnValue('new_hashed');
      mockUpdate.mockResolvedValue(undefined);

      // Act
      await service.changeEncryptedPassword(credentials, 'enc_old', 'enc_new');

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.decrypt).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        passwordHash: 'new_hashed',
        attempts: 0,
      });
    });

    it('debe propagar UnauthorizedException si la contraseña anterior desencriptada no coincide', async () => {
      // Arrange
      const credentials = buildCredentials({ passwordHash: 'hash' });
      (CryptoHelper.decrypt as jest.Mock)
        .mockReturnValueOnce(Buffer.from('old_plain'))
        .mockReturnValueOnce(Buffer.from('new_plain'));
      (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(
        service.changeEncryptedPassword(credentials, 'enc_old', 'enc_new'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
