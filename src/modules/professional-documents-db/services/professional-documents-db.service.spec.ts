import { Test, TestingModule } from '@nestjs/testing';
import { DocumentReviewStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { ProfessionalDocumentsDbService } from './professional-documents-db.service';

const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockCount = jest.fn();
const mockUpdateMany = jest.fn();

const mockPrisma = {
  extended: {
    professionalDocuments: {
      create: mockCreate,
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      count: mockCount,
      updateMany: mockUpdateMany,
    },
  },
};

describe('ProfessionalDocumentsDbService', () => {
  let service: ProfessionalDocumentsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalDocumentsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProfessionalDocumentsDbService>(
      ProfessionalDocumentsDbService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('findPublicByProfessionalId', () => {
    it('debe filtrar solo APPROVED con el tipo visible al cliente', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      await service.findPublicByProfessionalId(10);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            professionalId: 10,
            isActive: true,
            status: DocumentReviewStatus.APPROVED,
            professionalDocumentType: { isVisibleToClient: true },
          },
        }),
      );
    });
  });

  describe('hasActiveApproved', () => {
    it('debe considerar aprobado y vigente cuando expiresAt es null', async () => {
      // Arrange
      mockCount.mockResolvedValue(1);

      // Act
      const result = await service.hasActiveApproved(10, 5);

      // Assert
      expect(result).toBe(true);
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          professionalId: 10,
          professionalDocumentTypeId: 5,
          isActive: true,
          status: DocumentReviewStatus.APPROVED,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) as Date } },
          ],
        },
      });
    });

    it('debe devolver false cuando no hay ninguno vigente', async () => {
      // Arrange
      mockCount.mockResolvedValue(0);

      // Act
      const result = await service.hasActiveApproved(10, 5);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('updateStatusConditional', () => {
    it('debe devolver 0 si el documento ya no está en el estado esperado (TOCTOU)', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 0 });

      // Act
      const result = await service.updateStatusConditional(
        1,
        [DocumentReviewStatus.PENDING],
        { status: DocumentReviewStatus.APPROVED },
      );

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('findPaginatedForAdmin', () => {
    it('debe combinar el filtro de status/category con isActive en el where', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      // Act
      await service.findPaginatedForAdmin(
        {
          status: DocumentReviewStatus.PENDING,
          category: 'BACKGROUND_CHECK',
        },
        { page: 1, pageSize: 10 },
      );

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            status: DocumentReviewStatus.PENDING,
            professionalDocumentType: { category: 'BACKGROUND_CHECK' },
          },
        }),
      );
    });

    it('debe incluir el profesional con su usuario para dar contexto en la cola', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      // Act
      await service.findPaginatedForAdmin({}, { page: 1, pageSize: 10 });

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            professionalDocumentType: true,
            professional: { include: { user: true } },
          },
        }),
      );
    });
  });

  describe('findExpiredApproved', () => {
    it('debe buscar solo APPROVED vencidos incluyendo el userId del profesional', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      await service.findExpiredApproved();

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          status: DocumentReviewStatus.APPROVED,
          expiresAt: { lt: expect.any(Date) as Date },
        },
        include: { professional: { select: { userId: true } } },
      });
    });
  });
});
