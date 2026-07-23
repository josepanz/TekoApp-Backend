import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProfessionalStatus, ServiceStatus, RatingType } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import { ProfessionalsDbService } from './professionals-db.service';
import {
  professionalWithRelationsInclude,
  professionalServicesInclude,
  professionalReviewsInclude,
} from '../types/professionals-db.type';

// ─── Mock de PrismaPaginationUtil ─────────────────────────────────────────────
jest.mock('@common/utils/prisma-pagination.util');
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockPaginate = PrismaPaginationUtil.paginate as jest.MockedFunction<
  typeof PrismaPaginationUtil.paginate
>;

// ─── Mocks de users ───────────────────────────────────────────────────────────
const mockUsersFindUnique = jest.fn();

// ─── Mocks de professionals ───────────────────────────────────────────────────
const mockProfessionalsFindUnique = jest.fn();
const mockProfessionalsFindMany = jest.fn();
const mockProfessionalsCreate = jest.fn();
const mockProfessionalsUpdate = jest.fn();

// ─── Mocks de category ────────────────────────────────────────────────────────
const mockCategoryFindUnique = jest.fn();

// ─── Mocks de services ────────────────────────────────────────────────────────
const mockServicesCount = jest.fn();
const mockServicesAggregate = jest.fn();

// ─── Mocks de rating ─────────────────────────────────────────────────────────
const mockRatingDelegate = {};

const mockPrisma = {
  extended: {
    users: {
      findUnique: mockUsersFindUnique,
    },
    professionals: {
      findUnique: mockProfessionalsFindUnique,
      findMany: mockProfessionalsFindMany,
      create: mockProfessionalsCreate,
      update: mockProfessionalsUpdate,
    },
    category: {
      findUnique: mockCategoryFindUnique,
    },
    services: {
      count: mockServicesCount,
      aggregate: mockServicesAggregate,
    },
    rating: mockRatingDelegate,
  },
};

describe('ProfessionalsDbService', () => {
  let service: ProfessionalsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProfessionalsDbService>(ProfessionalsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ──────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto = { categoryId: 1, bio: 'Electricista certificado' } as never;

    it('debe crear y retornar el nuevo perfil profesional cuando todos los datos son válidos', async () => {
      // Arrange
      const user = { id: 5 };
      const category = { id: 1, name: 'Electricidad' };
      const created = { id: 10, userId: 5, status: ProfessionalStatus.PENDING };
      mockUsersFindUnique.mockResolvedValue(user);
      mockProfessionalsFindUnique.mockResolvedValue(null);
      mockCategoryFindUnique.mockResolvedValue(category);
      mockProfessionalsCreate.mockResolvedValue(created);

      // Act
      const result = await service.create(dto, 5);

      // Assert
      expect(result).toEqual(created);
      expect(mockProfessionalsCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 5,
          status: ProfessionalStatus.PENDING,
          isAvailable: false,
          isActive: true,
        }) as unknown,
        include: professionalWithRelationsInclude,
      });
    });

    it('debe lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(dto, 999)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException cuando el usuario ya tiene perfil profesional', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue({ id: 5 });
      mockProfessionalsFindUnique.mockResolvedValue({ id: 1, userId: 5 });

      // Act & Assert
      await expect(service.create(dto, 5)).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException cuando la categoría no existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue({ id: 5 });
      mockProfessionalsFindUnique.mockResolvedValue(null);
      mockCategoryFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(dto, 5)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findMany ────────────────────────────────────────────────────────────
  describe('findMany', () => {
    it('debe delegar la paginación a PrismaPaginationUtil con where de solo activos por defecto', async () => {
      // Arrange
      const paginatedResult = {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      };
      mockPaginate.mockResolvedValue(paginatedResult);
      const filters = {};
      const query = { page: 1, pageSize: 10 } as never;

      // Act
      const result = await service.findMany(filters, query);

      // Assert
      expect(result).toEqual(paginatedResult);
      expect(mockPaginate).toHaveBeenCalledWith(
        mockPrisma.extended.professionals,
        query,
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }) as unknown,
          include: professionalWithRelationsInclude,
        }),
      );
    });

    it('debe aplicar filtros opcionales de categoría, disponibilidad, rating y precio cuando se proveen', async () => {
      // Arrange
      const paginatedResult = {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      };
      mockPaginate.mockResolvedValue(paginatedResult);
      const filters = {
        categoryId: 2,
        isAvailable: true,
        minRating: 4.0,
        maxPrice: 500,
      };
      const query = { page: 1, pageSize: 10 } as never;

      // Act
      await service.findMany(filters, query);

      // Assert
      expect(mockPaginate).toHaveBeenCalledWith(
        expect.anything(),
        query,
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 2,
            isAvailable: true,
            averageRating: { gte: 4.0 },
            hourlyRate: { lte: 500 },
          }) as unknown,
        }),
      );
    });

    it('debe aplicar filtro geográfico de bounding box cuando se proveen coordenadas y radio', async () => {
      // Arrange
      const paginatedResult = {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      };
      mockPaginate.mockResolvedValue(paginatedResult);
      const filters = { latitude: -25.28, longitude: -57.63, radius: 5 };
      const query = { page: 1 } as never;

      // Act
      await service.findMany(filters, query);

      // Assert
      expect(mockPaginate).toHaveBeenCalledWith(
        expect.anything(),
        query,
        expect.objectContaining({
          where: expect.objectContaining({
            currentLatitude: expect.objectContaining({
              gte: expect.any(Number) as unknown,
              lte: expect.any(Number) as unknown,
            }) as unknown,
            currentLongitude: expect.objectContaining({
              gte: expect.any(Number) as unknown,
              lte: expect.any(Number) as unknown,
            }) as unknown,
          }) as unknown,
        }),
      );
    });
  });

  // ─── findNearby ──────────────────────────────────────────────────────────
  describe('findNearby', () => {
    it('debe retornar hasta 50 profesionales disponibles dentro del rango geográfico', async () => {
      // Arrange
      const professionals = [{ id: 1 }, { id: 2 }];
      mockProfessionalsFindMany.mockResolvedValue(professionals);

      // Act
      const result = await service.findNearby(-25.28, -57.63, 10);

      // Assert
      expect(result).toEqual(professionals);
      expect(mockProfessionalsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isAvailable: true,
            isActive: true,
          }) as unknown,
          include: professionalWithRelationsInclude,
          orderBy: { averageRating: 'desc' },
          take: 50,
        }),
      );
    });

    it('debe aplicar filtro de categoría cuando se provee el parámetro opcional', async () => {
      // Arrange
      mockProfessionalsFindMany.mockResolvedValue([]);

      // Act
      await service.findNearby(-25.28, -57.63, 10, 3);

      // Assert
      expect(mockProfessionalsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 3 }) as unknown,
        }),
      );
    });

    it('debe usar radio de 10 km por defecto cuando no se especifica', async () => {
      // Arrange
      mockProfessionalsFindMany.mockResolvedValue([]);

      // Act
      await service.findNearby(-25.28, -57.63);

      // Assert
      expect(mockProfessionalsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentLatitude: expect.objectContaining({
              gte: expect.any(Number) as unknown,
            }) as unknown,
          }) as unknown,
        }),
      );
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('debe retornar el profesional con sus relaciones cuando existe', async () => {
      // Arrange
      const professional = { id: 1, userId: 5 };
      mockProfessionalsFindUnique.mockResolvedValue(professional);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(professional);
      expect(mockProfessionalsFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: professionalWithRelationsInclude,
      });
    });

    it('debe lanzar NotFoundException cuando no existe el profesional con ese id', async () => {
      // Arrange
      mockProfessionalsFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByUserId ────────────────────────────────────────────────────────
  describe('findByUserId', () => {
    it('debe retornar el perfil profesional vinculado al userId dado', async () => {
      // Arrange
      const professional = { id: 1, userId: 5 };
      mockProfessionalsFindUnique.mockResolvedValue(professional);

      // Act
      const result = await service.findByUserId(5);

      // Assert
      expect(result).toEqual(professional);
      expect(mockProfessionalsFindUnique).toHaveBeenCalledWith({
        where: { userId: 5 },
        include: professionalWithRelationsInclude,
      });
    });

    it('debe lanzar NotFoundException cuando el usuario no tiene perfil profesional', async () => {
      // Arrange
      mockProfessionalsFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByUserId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findByReferenceId / findProfessionalByReferenceId ──────────────────
  describe('findByReferenceId', () => {
    it('debe retornar el profesional cuando el referenceId existe', async () => {
      // Arrange
      const professional = {
        id: 1,
        referenceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userId: 5,
      };
      mockProfessionalsFindUnique.mockResolvedValue(professional);

      // Act
      const result = await service.findByReferenceId(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );

      // Assert
      expect(result).toEqual(professional);
      expect(mockProfessionalsFindUnique).toHaveBeenCalledWith({
        where: { referenceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        include: professionalWithRelationsInclude,
      });
    });

    it('debe retornar null cuando no existe el profesional con ese referenceId', async () => {
      // Arrange
      mockProfessionalsFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByReferenceId('inexistente');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findProfessionalByReferenceId', () => {
    it('debe retornar el profesional cuando el referenceId existe', async () => {
      // Arrange
      const professional = {
        id: 1,
        referenceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userId: 5,
      };
      mockProfessionalsFindUnique.mockResolvedValue(professional);

      // Act
      const result = await service.findProfessionalByReferenceId(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );

      // Assert
      expect(result).toEqual(professional);
    });

    it('debe lanzar NotFoundException cuando no existe el profesional con ese referenceId', async () => {
      // Arrange
      mockProfessionalsFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findProfessionalByReferenceId('inexistente'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────
  describe('update', () => {
    it('debe retornar el perfil profesional actualizado con los datos provistos', async () => {
      // Arrange
      const updated = { id: 1, description: 'Nueva descripción' };
      mockProfessionalsUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.update(1, {
        description: 'Nueva descripción',
      });

      // Assert
      expect(result).toEqual(updated);
      expect(mockProfessionalsUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { description: 'Nueva descripción' },
        include: professionalWithRelationsInclude,
      });
    });
  });

  // ─── findServices ────────────────────────────────────────────────────────
  describe('findServices', () => {
    it('debe retornar los servicios paginados del profesional', async () => {
      // Arrange
      const paginatedResult = {
        data: [{ id: 'svc-1' }],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      };
      mockPaginate.mockResolvedValue(paginatedResult);
      const query = { page: 1, pageSize: 10 } as never;

      // Act
      const result = await service.findServices(5, query);

      // Assert
      expect(result).toEqual(paginatedResult);
      expect(mockPaginate).toHaveBeenCalledWith(
        mockPrisma.extended.services,
        query,
        expect.objectContaining({
          where: { professionalId: 5 },
          include: professionalServicesInclude,
        }),
      );
    });

    it('debe aplicar filtro de status cuando se provee el parámetro opcional', async () => {
      // Arrange
      const paginatedResult = {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      };
      mockPaginate.mockResolvedValue(paginatedResult);
      const query = { page: 1 } as never;

      // Act
      await service.findServices(5, query, ServiceStatus.COMPLETED);

      // Assert
      expect(mockPaginate).toHaveBeenCalledWith(
        expect.anything(),
        query,
        expect.objectContaining({
          where: { professionalId: 5, status: ServiceStatus.COMPLETED },
        }),
      );
    });
  });

  // ─── findReviews ─────────────────────────────────────────────────────────
  describe('findReviews', () => {
    it('debe retornar las reseñas paginadas de clientes hacia el profesional activas', async () => {
      // Arrange
      const paginatedResult = {
        data: [{ id: 'r1' }],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      };
      mockPaginate.mockResolvedValue(paginatedResult);
      const query = { page: 1 } as never;

      // Act
      const result = await service.findReviews(3, query);

      // Assert
      expect(result).toEqual(paginatedResult);
      expect(mockPaginate).toHaveBeenCalledWith(
        mockRatingDelegate,
        query,
        expect.objectContaining({
          where: {
            professionalId: 3,
            type: RatingType.CLIENT_TO_PROFESSIONAL,
            isActive: true,
          },
          include: professionalReviewsInclude,
        }),
      );
    });
  });

  // ─── getStats ────────────────────────────────────────────────────────────
  describe('getStats', () => {
    it('debe retornar las estadísticas del profesional con ganancias totales calculadas', async () => {
      // Arrange
      const professional = {
        id: 1,
        userId: 5,
        totalServices: 20,
        totalRatings: 15,
        averageRating: 4.5,
      };
      mockProfessionalsFindUnique.mockResolvedValue(professional);
      mockServicesCount.mockResolvedValue(12);
      mockServicesAggregate.mockResolvedValue({ _sum: { finalAmount: 75000 } });

      // Act
      const result = await service.getStats(1);

      // Assert
      expect(result).toEqual({
        totalServices: 20,
        completedServices: 12,
        totalEarnings: 75000,
        averageRating: 4.5,
        totalRatings: 15,
      });
      expect(mockServicesCount).toHaveBeenCalledWith({
        where: { professionalId: 1, status: ServiceStatus.COMPLETED },
      });
      expect(mockServicesAggregate).toHaveBeenCalledWith({
        where: { professionalId: 1, status: ServiceStatus.COMPLETED },
        _sum: { finalAmount: true },
      });
    });

    it('debe retornar totalEarnings en 0 cuando el finalAmount es null', async () => {
      // Arrange
      const professional = {
        id: 1,
        userId: 5,
        totalServices: 0,
        totalRatings: 0,
        averageRating: 0,
      };
      mockProfessionalsFindUnique.mockResolvedValue(professional);
      mockServicesCount.mockResolvedValue(0);
      mockServicesAggregate.mockResolvedValue({ _sum: { finalAmount: null } });

      // Act
      const result = await service.getStats(1);

      // Assert
      expect(result.totalEarnings).toBe(0);
    });

    it('debe lanzar NotFoundException cuando el profesional no existe', async () => {
      // Arrange
      mockProfessionalsFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStats(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── searchBySkills ──────────────────────────────────────────────────────
  describe('searchBySkills', () => {
    it('debe retornar profesionales activos que tengan al menos una de las habilidades buscadas', async () => {
      // Arrange
      const paginatedResult = {
        data: [{ id: 1 }],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      };
      mockPaginate.mockResolvedValue(paginatedResult);
      const query = { page: 1 } as never;

      // Act
      const result = await service.searchBySkills(
        ['react', 'typescript'],
        query,
      );

      // Assert
      expect(result).toEqual(paginatedResult);
      expect(mockPaginate).toHaveBeenCalledWith(
        mockPrisma.extended.professionals,
        query,
        expect.objectContaining({
          where: {
            isActive: true,
            skills: { hasSome: ['react', 'typescript'] },
          },
          include: professionalWithRelationsInclude,
        }),
      );
    });
  });

  // ─── getTopRated ─────────────────────────────────────────────────────────
  describe('getTopRated', () => {
    it('debe retornar los 10 profesionales mejor calificados por defecto', async () => {
      // Arrange
      const professionals = [
        { id: 1, averageRating: 4.9 },
        { id: 2, averageRating: 4.7 },
      ];
      mockProfessionalsFindMany.mockResolvedValue(professionals);

      // Act
      const result = await service.getTopRated();

      // Assert
      expect(result).toEqual(professionals);
      expect(mockProfessionalsFindMany).toHaveBeenCalledWith({
        where: { isActive: true, averageRating: { gt: 0 } },
        include: professionalWithRelationsInclude,
        orderBy: [{ averageRating: 'desc' }, { totalServices: 'desc' }],
        take: 10,
      });
    });

    it('debe filtrar por categoría y respetar el límite cuando se proveen ambos parámetros', async () => {
      // Arrange
      mockProfessionalsFindMany.mockResolvedValue([]);

      // Act
      await service.getTopRated(2, 5);

      // Assert
      expect(mockProfessionalsFindMany).toHaveBeenCalledWith({
        where: { isActive: true, averageRating: { gt: 0 }, categoryId: 2 },
        include: professionalWithRelationsInclude,
        orderBy: [{ averageRating: 'desc' }, { totalServices: 'desc' }],
        take: 5,
      });
    });
  });
});
