import { Test, TestingModule } from '@nestjs/testing';
import { AiDisclosureEntityType, LegalDocumentType } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { LegalConsentsDbService } from './legal-consents-db.service';

const mockLegalDocumentVersionsFindMany = jest.fn();
const mockLegalDocumentVersionsFindUnique = jest.fn();
const mockUserConsentsCount = jest.fn();
const mockUserConsentsFindUnique = jest.fn();
const mockUserConsentsCreate = jest.fn();
const mockContentConsentGrantsFindFirst = jest.fn();
const mockContentConsentGrantsUpdate = jest.fn();
const mockDataRetentionPoliciesFindUnique = jest.fn();

const mockPrisma = {
  extended: {
    legalDocumentVersions: {
      findMany: mockLegalDocumentVersionsFindMany,
      findUnique: mockLegalDocumentVersionsFindUnique,
    },
    userConsents: {
      count: mockUserConsentsCount,
      findUnique: mockUserConsentsFindUnique,
      create: mockUserConsentsCreate,
    },
    contentConsentGrants: {
      findFirst: mockContentConsentGrantsFindFirst,
      update: mockContentConsentGrantsUpdate,
    },
    dataRetentionPolicies: {
      findUnique: mockDataRetentionPoliciesFindUnique,
    },
  },
};

describe('LegalConsentsDbService', () => {
  let service: LegalConsentsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalConsentsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LegalConsentsDbService>(LegalConsentsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('hasActiveConsent', () => {
    it('debe retornar true cuando existe un consentimiento vigente para el tipo de documento', async () => {
      // Arrange
      mockUserConsentsCount.mockResolvedValue(1);

      // Act
      const result = await service.hasActiveConsent(
        5,
        LegalDocumentType.IMAGE_USAGE_CONSENT,
      );

      // Assert
      expect(result).toBe(true);
      expect(mockUserConsentsCount).toHaveBeenCalledWith({
        where: {
          userId: 5,
          legalDocumentVersion: {
            documentType: LegalDocumentType.IMAGE_USAGE_CONSENT,
            isActive: true,
            countryId: null,
          },
        },
      });
    });

    it('debe retornar false cuando no hay ningún consentimiento vigente', async () => {
      // Arrange
      mockUserConsentsCount.mockResolvedValue(0);

      // Act
      const result = await service.hasActiveConsent(
        5,
        LegalDocumentType.IMAGE_USAGE_CONSENT,
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('findPendingVersionsForUser', () => {
    it('debe buscar solo versiones activas, internacionales, sin consentimiento del usuario', async () => {
      // Arrange
      mockLegalDocumentVersionsFindMany.mockResolvedValue([]);

      // Act
      await service.findPendingVersionsForUser(5);

      // Assert
      expect(mockLegalDocumentVersionsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            countryId: null,
            consents: { none: { userId: 5 } },
          },
        }),
      );
    });
  });

  describe('createConsent', () => {
    it('debe crear el UserConsents con los datos provistos', async () => {
      // Arrange
      const data = {
        userId: 5,
        legalDocumentVersionId: 10,
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        acceptanceHash: 'hash',
      };
      const created = { id: 1, ...data };
      mockUserConsentsCreate.mockResolvedValue(created);

      // Act
      const result = await service.createConsent(data);

      // Assert
      expect(result).toEqual(created);
      expect(mockUserConsentsCreate).toHaveBeenCalledWith({ data });
    });
  });

  describe('revokeContentGrant', () => {
    it('debe marcar revokedAt en el grant indicado', async () => {
      // Arrange
      mockContentConsentGrantsUpdate.mockResolvedValue({
        id: 1,
        revokedAt: new Date(),
      });

      // Act
      await service.revokeContentGrant(1);

      // Assert
      expect(mockContentConsentGrantsUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { revokedAt: expect.any(Date) as Date },
      });
    });
  });

  describe('findRetentionPolicy', () => {
    it('debe buscar por (countryId=null, contentType) por default', async () => {
      // Arrange
      mockDataRetentionPoliciesFindUnique.mockResolvedValue(null);

      // Act
      await service.findRetentionPolicy(AiDisclosureEntityType.IMAGE);

      // Assert
      expect(mockDataRetentionPoliciesFindUnique).toHaveBeenCalledWith({
        where: {
          countryId_contentType: {
            countryId: null,
            contentType: AiDisclosureEntityType.IMAGE,
          },
        },
      });
    });
  });
});
