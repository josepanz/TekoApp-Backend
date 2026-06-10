import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Users, UserStatus } from '@prisma/client';

import { AuthTokenService } from './auth-token.service';
import { CryptoHelper } from '@common/helpers/crypto-helpers';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { APP_CONFIG } from '@core/config/config-loader';

// ─── Mocks de dependencias ────────────────────────────────────────────────────

const mockFindUnique = jest.fn();

jest.mock('@common/helpers/crypto-helpers', () => ({
  CryptoHelper: {
    initConfigService: jest.fn(),
    generateToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  },
}));

const mockAppConfig = {
  authentication: {
    accessTokenExpires: '15m',
    refreshTokenExpires: '7d',
    shortRefreshTokenExpires: '12h',
    tempTokenExpires: '1h',
    privateKey: 'test-private-key',
    publicKey: 'test-public-key',
  },
  email: {
    host: 'smtp.test.com',
    port: 25,
    user: 'u',
    password: 'p',
    dir: 'd',
  },
  baseUrl: 'http://localhost:3000',
};

function buildUser(overrides: Record<string, unknown> = {}): Users {
  return {
    id: 1,
    referenceId: 'ref-uuid-123',
    email: 'user@test.com',
    status: UserStatus.ACTIVE,
    isEmployee: false,
    firstName: 'Ana',
    lastName: 'Lopez',
    accessLevelId: null,
    profileStatus: 'COMPLETE',
    ...overrides,
  } as unknown as Users;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AuthTokenService', () => {
  let service: AuthTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTokenService,
        {
          provide: PrismaDatasource,
          useValue: {
            extended: {
              users: {
                findUnique: mockFindUnique,
              },
            },
          },
        },
        {
          provide: APP_CONFIG.KEY,
          useValue: mockAppConfig,
        },
      ],
    }).compile();

    service = module.get<AuthTokenService>(AuthTokenService);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────────────────────────────────
  // generateTokens
  // ──────────────────────────────────────────────────────────────────────────

  describe('generateTokens', () => {
    it('debe generar accessToken y refreshToken con expiración larga cuando rememberMe es true', () => {
      // Arrange
      (CryptoHelper.generateToken as jest.Mock)
        .mockReturnValueOnce('access_token_value')
        .mockReturnValueOnce('refresh_token_value');
      const user: Users = buildUser();

      // Act
      const result: { accessToken: string; refreshToken: string } =
        service.generateTokens({
          user,
          rememberMe: true,
        });

      // Assert
      expect(result.accessToken).toBe('access_token_value');
      expect(result.refreshToken).toBe('refresh_token_value');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.generateToken).toHaveBeenNthCalledWith(
        1,
        'accessToken',
        expect.objectContaining({
          sub: 'ref-uuid-123',
          email: 'user@test.com',
        }),
        'RS256',
        '15m',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.generateToken).toHaveBeenNthCalledWith(
        2,
        'refreshToken',
        expect.objectContaining({ sub: 'ref-uuid-123', type: 'refresh' }),
        'RS256',
        '7d',
      );
    });

    it('debe usar expiración corta del refreshToken cuando rememberMe es false', () => {
      // Arrange
      (CryptoHelper.generateToken as jest.Mock)
        .mockReturnValueOnce('access_tok')
        .mockReturnValueOnce('refresh_short');
      const user: Users = buildUser();

      // Act
      const result: { accessToken: string; refreshToken: string } =
        service.generateTokens({
          user,
          rememberMe: false,
        });

      // Assert
      expect(result.refreshToken).toBe('refresh_short');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CryptoHelper.generateToken).toHaveBeenNthCalledWith(
        2,
        'refreshToken',
        expect.any(Object),
        'RS256',
        '12h',
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // generateAccessTokenFromRefresh
  // ──────────────────────────────────────────────────────────────────────────

  describe('generateAccessTokenFromRefresh', () => {
    it('debe generar un nuevo accessToken cuando el refresh token es válido y el usuario está activo', async () => {
      // Arrange
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        sub: 'ref-uuid-123',
      });
      mockFindUnique.mockResolvedValue(buildUser());
      (CryptoHelper.generateToken as jest.Mock).mockReturnValue(
        'new_access_token',
      );

      // Act
      const result =
        await service.generateAccessTokenFromRefresh('valid_refresh');

      // Assert
      expect(result).toBe('new_access_token');
      const expectedCall: {
        where: { referenceId: string };
        select: jest.Expect;
      } = {
        where: { referenceId: 'ref-uuid-123' },
        select: expect.any(Object) as jest.Expect,
      };
      expect(mockFindUnique).toHaveBeenCalledWith(expectedCall);
    });

    it('debe lanzar UnauthorizedException si el tokenType no es refreshToken', async () => {
      // Arrange
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'accessToken',
        sub: 'ref-uuid-123',
      });

      // Act & Assert
      await expect(
        service.generateAccessTokenFromRefresh('wrong_type_token'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si el usuario no existe en base de datos', async () => {
      // Arrange
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        sub: 'nonexistent-ref',
      });
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateAccessTokenFromRefresh('valid_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el usuario está bloqueado', async () => {
      // Arrange
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        sub: 'ref-uuid-123',
      });
      mockFindUnique.mockResolvedValue(
        buildUser({ status: UserStatus.BLOCKED }),
      );

      // Act & Assert
      await expect(
        service.generateAccessTokenFromRefresh('valid_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el usuario está inactivo', async () => {
      // Arrange
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        sub: 'ref-uuid-123',
      });
      mockFindUnique.mockResolvedValue(
        buildUser({ status: UserStatus.INACTIVE }),
      );

      // Act & Assert
      await expect(
        service.generateAccessTokenFromRefresh('valid_token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
