import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { BasicAuthGuard } from './basic-auth.guard';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { CryptoHelper } from '@common/helpers/crypto-helpers';

jest.mock('@common/helpers/crypto-helpers', () => ({
  CryptoHelper: {
    compareHashes: jest.fn(),
  },
}));

const mockFindUnique = jest.fn();

function buildContext(authHeader?: string): ExecutionContext {
  const request = {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request & { apiClient?: unknown };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

/** Arma un header Basic con client_id:client_secret. */
function basicHeader(clientId: string, secret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`;
}

describe('BasicAuthGuard', () => {
  let guard: BasicAuthGuard;

  beforeEach(() => {
    const prisma = {
      extended: { apiClientCredential: { findUnique: mockFindUnique } },
    } as unknown as PrismaDatasource;
    guard = new BasicAuthGuard(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  it('debe permitir el acceso cuando el secreto coincide con el hash almacenado', async () => {
    // Arrange
    mockFindUnique.mockResolvedValue({
      clientId: 'tekoapp-web',
      clientName: 'Web',
      secretKey: 'hashed_secret',
      isActive: true,
    });
    (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(true);

    // Act
    const result = await guard.canActivate(
      buildContext(basicHeader('tekoapp-web', 'plain_secret')),
    );

    // Assert
    expect(result).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(CryptoHelper.compareHashes).toHaveBeenCalledWith(
      'plain_secret',
      'hashed_secret',
    );
  });

  it('debe lanzar UnauthorizedException cuando el secreto no coincide con el hash', async () => {
    // Arrange
    mockFindUnique.mockResolvedValue({
      clientId: 'tekoapp-web',
      secretKey: 'hashed_secret',
      isActive: true,
    });
    (CryptoHelper.compareHashes as jest.Mock).mockReturnValue(false);

    // Act & Assert
    await expect(
      guard.canActivate(buildContext(basicHeader('tekoapp-web', 'wrong'))),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException cuando no hay header Basic', async () => {
    // Act & Assert
    await expect(guard.canActivate(buildContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe lanzar UnauthorizedException cuando el client_id no existe', async () => {
    // Arrange
    mockFindUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      guard.canActivate(buildContext(basicHeader('desconocido', 'x'))),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar ForbiddenException cuando el cliente está inactivo', async () => {
    // Arrange
    mockFindUnique.mockResolvedValue({
      clientId: 'tekoapp-web',
      secretKey: 'hashed_secret',
      isActive: false,
    });

    // Act & Assert
    await expect(
      guard.canActivate(buildContext(basicHeader('tekoapp-web', 'x'))),
    ).rejects.toThrow(ForbiddenException);
  });
});
