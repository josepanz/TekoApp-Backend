import { Test, TestingModule } from '@nestjs/testing';
import { AiDisclosureEntityType, LegalDocumentType } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import { LegalConsentsDbService } from './legal-consents-db.service';

jest.mock('@common/utils/prisma-pagination.util');
// eslint-disable-next-line @typescript-eslint/unbound-method -- static method mockeado por jest.mock, nunca se invoca desatado de la clase
const mockPaginate = jest.mocked(PrismaPaginationUtil.paginate);

const mockLegalDocumentVersionsFindMany = jest.fn();
const mockLegalDocumentVersionsFindUnique = jest.fn();
const mockUserConsentsCount = jest.fn();
const mockUserConsentsFindUnique = jest.fn();
const mockUserConsentsCreate = jest.fn();
const mockContentConsentGrantsFindFirst = jest.fn();
const mockContentConsentGrantsUpdate = jest.fn();
const mockContentConsentGrantsFindMany = jest.fn();
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
      findMany: mockContentConsentGrantsFindMany,
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

  describe('findConsentsAuditPaginated', () => {
    it('arma el where anidado a partir de los filtros y excluye createdAt (la tabla no lo tiene)', async () => {
      // Arrange
      mockPaginate.mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      });
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      // Act
      await service.findConsentsAuditPaginated(
        {
          documentType: LegalDocumentType.TERMS_OF_SERVICE,
          countryId: 1,
          userReferenceId: 'user-ref-1',
          startDate,
          endDate,
        },
        { page: 1, pageSize: 10, startDate, endDate },
      );

      // Assert
      expect(mockPaginate).toHaveBeenCalledWith(
        mockPrisma.extended.userConsents,
        { page: 1, pageSize: 10 },
        expect.objectContaining({
          where: {
            legalDocumentVersion: {
              documentType: LegalDocumentType.TERMS_OF_SERVICE,
              countryId: 1,
            },
            user: { referenceId: 'user-ref-1' },
            acceptedAt: { gte: startDate, lte: endDate },
          },
          defaultOrderByField: 'acceptedAt',
        }),
      );
    });
  });

  describe('findContentConsentGrantsAuditPaginated', () => {
    it('arma el where anidado a partir de los filtros (incluyendo revoked como filtro de revokedAt)', async () => {
      // Arrange
      mockPaginate.mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      });

      // Act
      await service.findContentConsentGrantsAuditPaginated(
        {
          contentType: AiDisclosureEntityType.IMAGE,
          revoked: false,
          uploaderReferenceId: 'user-ref-2',
        },
        { page: 1, pageSize: 10 },
      );

      // Assert
      expect(mockPaginate).toHaveBeenCalledWith(
        mockPrisma.extended.contentConsentGrants,
        { page: 1, pageSize: 10 },
        expect.objectContaining({
          where: {
            contentType: AiDisclosureEntityType.IMAGE,
            revokedAt: null,
            uploader: { referenceId: 'user-ref-2' },
          },
          defaultOrderByField: 'grantedAt',
        }),
      );
    });
  });
});
