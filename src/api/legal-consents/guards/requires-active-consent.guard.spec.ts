import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { LegalDocumentType } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { RequiresActiveConsentGuard } from './requires-active-consent.guard';
import { LegalConsentsDbService } from '@modules/legal-consents-db/services/legal-consents-db.service';

const mockGetAllAndOverride = jest.fn();
const mockHasActiveConsent = jest.fn();

function buildContext(userId = 1): ExecutionContext {
  const request = { user: { id: userId } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RequiresActiveConsentGuard', () => {
  let guard: RequiresActiveConsentGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    const reflector = {
      getAllAndOverride: mockGetAllAndOverride,
    } as unknown as Reflector;
    const legalConsentsDb = {
      hasActiveConsent: mockHasActiveConsent,
    } as unknown as LegalConsentsDbService;
    guard = new RequiresActiveConsentGuard(reflector, legalConsentsDb);
  });

  it('deja pasar el endpoint si no declara @RequiresActiveConsent', async () => {
    // Arrange
    mockGetAllAndOverride.mockReturnValue(undefined);

    // Act
    const result = await guard.canActivate(buildContext());

    // Assert
    expect(result).toBe(true);
    expect(mockHasActiveConsent).not.toHaveBeenCalled();
  });

  it('deja pasar si el usuario tiene consentimiento vigente para el documento requerido', async () => {
    // Arrange
    mockGetAllAndOverride.mockReturnValue(
      LegalDocumentType.IMAGE_USAGE_CONSENT,
    );
    mockHasActiveConsent.mockResolvedValue(true);

    // Act
    const result = await guard.canActivate(buildContext(7));

    // Assert
    expect(result).toBe(true);
    expect(mockHasActiveConsent).toHaveBeenCalledWith(
      7,
      LegalDocumentType.IMAGE_USAGE_CONSENT,
    );
  });

  it('bloquea con ForbiddenException (CONSENT_REQUIRED) si no hay consentimiento vigente', async () => {
    // Arrange
    mockGetAllAndOverride.mockReturnValue(
      LegalDocumentType.IMAGE_USAGE_CONSENT,
    );
    mockHasActiveConsent.mockResolvedValue(false);

    // Act & Assert
    await expect(guard.canActivate(buildContext(7))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
