import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AiDisclosureEntityType, LegalDocumentType } from '@prisma/client';
import { LegalConsentsService } from './legal-consents.service';
import { LegalConsentsDbService } from '@modules/legal-consents-db/services/legal-consents-db.service';

const mockFindVersionByReferenceId = jest.fn();
const mockFindConsentByUserAndVersion = jest.fn();
const mockCreateConsent = jest.fn();
const mockFindActiveContentGrantByReferenceId = jest.fn();
const mockFindRetentionPolicy = jest.fn();
const mockRevokeContentGrant = jest.fn();
const mockFindPendingVersionsForUser = jest.fn();

describe('LegalConsentsService', () => {
  let service: LegalConsentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalConsentsService,
        {
          provide: LegalConsentsDbService,
          useValue: {
            findVersionByReferenceId: mockFindVersionByReferenceId,
            findConsentByUserAndVersion: mockFindConsentByUserAndVersion,
            createConsent: mockCreateConsent,
            findActiveContentGrantByReferenceId:
              mockFindActiveContentGrantByReferenceId,
            findRetentionPolicy: mockFindRetentionPolicy,
            revokeContentGrant: mockRevokeContentGrant,
            findPendingVersionsForUser: mockFindPendingVersionsForUser,
          },
        },
      ],
    }).compile();

    service = module.get<LegalConsentsService>(LegalConsentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findPendingForUser', () => {
    it('debe retornar las versiones pendientes del usuario', async () => {
      // Arrange
      const pending = [
        { id: 1, documentType: LegalDocumentType.TERMS_OF_SERVICE },
      ];
      mockFindPendingVersionsForUser.mockResolvedValue(pending);

      // Act
      const result = await service.findPendingForUser(5);

      // Assert
      expect(result).toEqual(pending);
      expect(mockFindPendingVersionsForUser).toHaveBeenCalledWith(5);
    });
  });

  describe('acceptVersion', () => {
    const version = {
      id: 10,
      documentType: LegalDocumentType.TERMS_OF_SERVICE,
    };

    it('debe crear el consentimiento cuando la versión existe y no fue aceptada antes', async () => {
      // Arrange
      mockFindVersionByReferenceId.mockResolvedValue(version);
      mockFindConsentByUserAndVersion.mockResolvedValue(null);
      const created = { id: 1, referenceId: 'ref-1' };
      mockCreateConsent.mockResolvedValue(created);

      // Act
      const result = await service.acceptVersion(
        5,
        'version-ref',
        '127.0.0.1',
        'jest-agent',
      );

      // Assert
      expect(result).toEqual(created);
      expect(mockCreateConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 5,
          legalDocumentVersionId: 10,
          ipAddress: '127.0.0.1',
          userAgent: 'jest-agent',
          acceptanceHash: expect.any(String) as string,
        }),
      );
    });

    it('debe lanzar NotFoundException si la versión no existe', async () => {
      // Arrange
      mockFindVersionByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.acceptVersion(5, 'version-ref', '127.0.0.1', 'jest-agent'),
      ).rejects.toThrow(NotFoundException);
      expect(mockCreateConsent).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el usuario ya aceptó esa versión', async () => {
      // Arrange
      mockFindVersionByReferenceId.mockResolvedValue(version);
      mockFindConsentByUserAndVersion.mockResolvedValue({ id: 99 });

      // Act & Assert
      await expect(
        service.acceptVersion(5, 'version-ref', '127.0.0.1', 'jest-agent'),
      ).rejects.toThrow(ConflictException);
      expect(mockCreateConsent).not.toHaveBeenCalled();
    });
  });

  describe('revokeContentConsent', () => {
    const grant = {
      id: 1,
      uploaderUserId: 5,
      contentType: AiDisclosureEntityType.IMAGE,
    };

    it('debe revocar el grant cuando el dueño lo pide y no hay retención legal', async () => {
      // Arrange
      mockFindActiveContentGrantByReferenceId.mockResolvedValue(grant);
      mockFindRetentionPolicy.mockResolvedValue({ requiresLegalHold: false });

      // Act
      await service.revokeContentConsent(5, 'content-ref');

      // Assert
      expect(mockRevokeContentGrant).toHaveBeenCalledWith(1);
    });

    it('debe lanzar NotFoundException si no hay un grant vigente', async () => {
      // Arrange
      mockFindActiveContentGrantByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.revokeContentConsent(5, 'content-ref'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si quien revoca no es el dueño del contenido', async () => {
      // Arrange
      mockFindActiveContentGrantByReferenceId.mockResolvedValue(grant);

      // Act & Assert
      await expect(
        service.revokeContentConsent(999, 'content-ref'),
      ).rejects.toThrow(ConflictException);
      expect(mockRevokeContentGrant).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException (LEGAL_HOLD_ACTIVE) si la política exige retención legal', async () => {
      // Arrange
      mockFindActiveContentGrantByReferenceId.mockResolvedValue(grant);
      mockFindRetentionPolicy.mockResolvedValue({ requiresLegalHold: true });

      // Act & Assert
      await expect(
        service.revokeContentConsent(5, 'content-ref'),
      ).rejects.toThrow(ConflictException);
      expect(mockRevokeContentGrant).not.toHaveBeenCalled();
    });
  });
});
