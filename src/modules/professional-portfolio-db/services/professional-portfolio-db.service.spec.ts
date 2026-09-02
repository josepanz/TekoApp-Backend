import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioReviewStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { ProfessionalPortfolioDbService } from './professional-portfolio-db.service';

const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpdateMany = jest.fn();
const mockCount = jest.fn();

const mockPrisma = {
  extended: {
    professionalPortfolioItems: {
      create: mockCreate,
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
      updateMany: mockUpdateMany,
      count: mockCount,
    },
  },
};

describe('ProfessionalPortfolioDbService', () => {
  let service: ProfessionalPortfolioDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalPortfolioDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProfessionalPortfolioDbService>(
      ProfessionalPortfolioDbService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAllByProfessionalId', () => {
    it('debe ordenar por sortOrder y luego por más reciente', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      await service.findAllByProfessionalId(10);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { professionalId: 10, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findPublicByProfessionalId', () => {
    it('debe filtrar solo APPROVED y visible', async () => {
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
            status: PortfolioReviewStatus.APPROVED,
            isVisible: true,
          },
        }),
      );
    });
  });

  describe('updateStatusConditional', () => {
    it('debe devolver 0 si la foto ya no está en el estado esperado (TOCTOU)', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 0 });

      // Act
      const result = await service.updateStatusConditional(
        1,
        [PortfolioReviewStatus.PENDING],
        { status: PortfolioReviewStatus.APPROVED },
      );

      // Assert
      expect(result).toBe(0);
    });

    it('debe devolver 1 si la actualización aplicó sobre el estado esperado', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      const result = await service.updateStatusConditional(
        1,
        [PortfolioReviewStatus.PENDING],
        { status: PortfolioReviewStatus.REJECTED },
      );

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('findPaginatedForAdmin', () => {
    it('debe combinar el filtro de status con isActive en el where', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      // Act
      await service.findPaginatedForAdmin(
        { status: PortfolioReviewStatus.PENDING },
        { page: 1, pageSize: 10 },
      );

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, status: PortfolioReviewStatus.PENDING },
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
          include: { professional: { include: { user: true } } },
        }),
      );
    });
  });

  describe('delete', () => {
    it('debe borrar la foto por id', async () => {
      // Arrange
      mockDelete.mockResolvedValue(undefined);

      // Act
      await service.delete(7);

      // Assert
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 7 } });
    });
  });
});
