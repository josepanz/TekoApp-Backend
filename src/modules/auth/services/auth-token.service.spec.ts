import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Users, UserStatus } from '@prisma/client';

import { AuthTokenService } from './auth-token.service';
import { TokenRevocationService } from './token-revocation.service';
import { CryptoHelper } from '@common/helpers/crypto-helpers';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { APP_CONFIG } from '@core/config/config-loader';

// ─── Mocks de dependencias ────────────────────────────────────────────────────

const mockFindUnique = jest.fn();
const mockFindFirstCredentials = jest.fn();
const mockIsRevoked = jest.fn();
const mockRevoke = jest.fn();

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
              userCredentials: {
                findFirst: mockFindFirstCredentials,
              },
            },
          },
        },
        {
          provide: APP_CONFIG.KEY,
          useValue: mockAppConfig,
        },
        {
          provide: TokenRevocationService,
          useValue: { isRevoked: mockIsRevoked, revoke: mockRevoke },
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
      mockFindFirstCredentials.mockResolvedValue({ expiredAt: null });
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

    it('debe lanzar PASSWORD_EXPIRED si la contraseña activa del usuario expiró', async () => {
      // Arrange
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        sub: 'ref-uuid-123',
      });
      mockFindUnique.mockResolvedValue(buildUser());
      mockFindFirstCredentials.mockResolvedValue({
        expiredAt: new Date(Date.now() - 1000),
      });

      // Act & Assert
      await expect(
        service.generateAccessTokenFromRefresh('valid_token'),
      ).rejects.toMatchObject({ response: { code: 'PASSWORD_EXPIRED' } });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DEF-BE-006: jti + revocación
  // ──────────────────────────────────────────────────────────────────────────

  describe('refresh token con jti (DEF-BE-006)', () => {
    it('generateTokens agrega un jti UUID distinto a cada refresh token', () => {
      (CryptoHelper.generateToken as jest.Mock).mockReturnValue('tok');

      service.generateTokens({ user: buildUser(), rememberMe: false });
      service.generateTokens({ user: buildUser(), rememberMe: false });

      const refreshPayloads = (
        CryptoHelper.generateToken as jest.Mock
      ).mock.calls
        .filter(([type]: [string]) => type === 'refreshToken')
        .map(([, payload]: [string, { jti: string }]) => payload.jti);
      expect(refreshPayloads).toHaveLength(2);
      expect(refreshPayloads[0]).toMatch(/^[0-9a-f-]{36}$/);
      expect(refreshPayloads[0]).not.toBe(refreshPayloads[1]);
    });

    it('rechaza con 401 un refresh cuyo jti está revocado, sin consultar al usuario', async () => {
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        sub: 'ref-uuid-123',
        jti: 'j1',
      });
      mockIsRevoked.mockResolvedValue(true);

      await expect(
        service.generateAccessTokenFromRefresh('rt'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockIsRevoked).toHaveBeenCalledWith('j1');
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it('acepta un refresh legacy sin jti (hasta que expire) sin consultar la denylist', async () => {
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        sub: 'ref-uuid-123',
      });
      mockFindUnique.mockResolvedValue(buildUser());
      mockFindFirstCredentials.mockResolvedValue({ expiredAt: null });
      (CryptoHelper.generateToken as jest.Mock).mockReturnValue('new');

      await expect(service.generateAccessTokenFromRefresh('rt')).resolves.toBe(
        'new',
      );
      expect(mockIsRevoked).not.toHaveBeenCalled();
    });
  });

  describe('revokeRefreshToken (logout)', () => {
    const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;

    it('revoca el jti con el TTL restante del token', async () => {
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        jti: 'j1',
        exp: inOneHour(),
      });

      await service.revokeRefreshToken('rt');

      const [jti, ttl] = mockRevoke.mock.calls[0] as [string, number];
      expect(jti).toBe('j1');
      expect(ttl).toBeGreaterThan(3590);
      expect(ttl).toBeLessThanOrEqual(3600);
    });

    it('es idempotente: revocar dos veces no lanza', async () => {
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        jti: 'j1',
        exp: inOneHour(),
      });

      await service.revokeRefreshToken('rt');
      await expect(service.revokeRefreshToken('rt')).resolves.toBeUndefined();
    });

    it('token legacy sin jti: no revoca y no lanza', async () => {
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        exp: inOneHour(),
      });

      await expect(service.revokeRefreshToken('rt')).resolves.toBeUndefined();
      expect(mockRevoke).not.toHaveBeenCalled();
    });

    it('rechaza con 401 un token que no es de refresh', async () => {
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'accessToken',
        jti: 'j1',
        exp: inOneHour(),
      });

      await expect(service.revokeRefreshToken('at')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Redis caído: 500 explícito (fail-closed)', async () => {
      (CryptoHelper.verifyRefreshToken as jest.Mock).mockReturnValue({
        tokenType: 'refreshToken',
        jti: 'j1',
        exp: inOneHour(),
      });
      mockRevoke.mockRejectedValue(new Error('down'));

      await expect(service.revokeRefreshToken('rt')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
