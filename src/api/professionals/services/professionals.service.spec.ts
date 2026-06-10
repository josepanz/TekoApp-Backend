import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';

const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockFindNearby = jest.fn();
const mockFindById = jest.fn();
const mockUpdate = jest.fn();
const mockFindServices = jest.fn();
const mockFindReviews = jest.fn();
const mockGetStats = jest.fn();
const mockSearchBySkills = jest.fn();
const mockGetTopRated = jest.fn();

const mockProfessional = {
  id: 1,
  userId: 10,
  categoryId: 2,
  isAvailable: true,
  status: 'APPROVED',
  verificationStatus: 'verified',
};

describe('ProfessionalsService', () => {
  let service: ProfessionalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalsService,
        {
          provide: ProfessionalsDbService,
          useValue: {
            create: mockCreate,
            findMany: mockFindMany,
            findNearby: mockFindNearby,
            findById: mockFindById,
            update: mockUpdate,
            findServices: mockFindServices,
            findReviews: mockFindReviews,
            getStats: mockGetStats,
            searchBySkills: mockSearchBySkills,
            getTopRated: mockGetTopRated,
          },
        },
      ],
    }).compile();

    service = module.get<ProfessionalsService>(ProfessionalsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('registerProfessional', () => {
    it('debe retornar el profesional creado desde la base de datos', async () => {
      // Arrange
      const dto = { categoryId: 2, bio: 'Plomero experto' } as never;
      mockCreate.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.registerProfessional(dto, 10);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(dto, 10);
      expect(result).toEqual(mockProfessional);
    });
  });

  describe('getProfessionals', () => {
    it('debe retornar lista de profesionales con filtros aplicados', async () => {
      // Arrange
      const query = {
        categoryId: 2,
        minRating: 4,
        isAvailable: true,
        page: 1,
        pageSize: 10,
      } as never;
      const mockResult = { data: [mockProfessional], pagination: { total: 1 } };
      mockFindMany.mockResolvedValue(mockResult);

      // Act
      const result = await service.getProfessionals(query);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 2,
          minRating: 4,
          isAvailable: true,
        }),
        query,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getNearbyProfessionals', () => {
    it('debe retornar profesionales cercanos al punto geográfico indicado', async () => {
      // Arrange
      const query = {
        latitude: -25.2867,
        longitude: -57.647,
        radius: 10,
        categoryId: 2,
      };
      mockFindNearby.mockResolvedValue([mockProfessional]);

      // Act
      const result = await service.getNearbyProfessionals(query);

      // Assert
      expect(mockFindNearby).toHaveBeenCalledWith(
        query.latitude,
        query.longitude,
        query.radius,
        query.categoryId,
      );
      expect(result).toEqual([mockProfessional]);
    });
  });

  describe('getProfessionalById', () => {
    it('debe retornar el profesional cuando el ID existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.getProfessionalById(1);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProfessional);
    });
  });

  describe('updateProfessional', () => {
    it('debe actualizar el profesional cuando el userId coincide', async () => {
      // Arrange
      const dto = { bio: 'Nueva bio' } as never;
      const updatedProfessional = { ...mockProfessional, bio: 'Nueva bio' };
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue(updatedProfessional);

      // Act
      const result = await service.updateProfessional(1, dto, 10);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockUpdate).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedProfessional);
    });

    it('debe lanzar ForbiddenException cuando el userId no coincide con el dueño del perfil', async () => {
      // Arrange
      const dto = { bio: 'Bio intento' } as never;
      mockFindById.mockResolvedValue({ ...mockProfessional, userId: 99 }); // dueño es userId=99

      // Act & Assert
      await expect(service.updateProfessional(1, dto, 10)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('updateAvailability', () => {
    it('debe actualizar la disponibilidad cuando el userId coincide', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue({ ...mockProfessional, isAvailable: false });

      // Act
      const result = await service.updateAvailability(1, false, 10);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(1, { isAvailable: false });
      expect(result).toBeDefined();
    });

    it('debe lanzar ForbiddenException cuando el userId no es el dueño', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...mockProfessional, userId: 55 });

      // Act & Assert
      await expect(service.updateAvailability(1, true, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateLocation', () => {
    it('debe actualizar la ubicación cuando el userId coincide', async () => {
      // Arrange
      const dto = { latitude: -25.3, longitude: -57.65 };
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue(mockProfessional);

      // Act
      await service.updateLocation(1, dto, 10);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          currentLatitude: dto.latitude,
          currentLongitude: dto.longitude,
        }),
      );
    });

    it('debe lanzar ForbiddenException cuando el userId no es el dueño', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...mockProfessional, userId: 55 });
      const dto = { latitude: -25.3, longitude: -57.65 };

      // Act & Assert
      await expect(service.updateLocation(1, dto as never, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getProfessionalServices', () => {
    it('debe retornar los servicios del profesional paginados', async () => {
      // Arrange
      const query = { page: 1, pageSize: 10, status: 'COMPLETED' };
      const mockResult = { data: [], pagination: { total: 0 } };
      mockFindServices.mockResolvedValue(mockResult);

      // Act
      const result = await service.getProfessionalServices(1, query as never);

      // Assert
      expect(mockFindServices).toHaveBeenCalledWith(1, query, query.status);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getProfessionalReviews', () => {
    it('debe retornar las reseñas del profesional', async () => {
      // Arrange
      const query = { page: 1, pageSize: 5 } as never;
      const mockResult = { data: [] };
      mockFindReviews.mockResolvedValue(mockResult);

      // Act
      const result = await service.getProfessionalReviews(1, query);

      // Assert
      expect(mockFindReviews).toHaveBeenCalledWith(1, query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getProfessionalStats', () => {
    it('debe retornar las estadísticas del profesional', async () => {
      // Arrange
      const mockStats = {
        totalServices: 50,
        completedServices: 45,
        averageRating: 4.8,
      };
      mockGetStats.mockResolvedValue(mockStats);

      // Act
      const result = await service.getProfessionalStats(1);

      // Assert
      expect(mockGetStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStats);
    });
  });

  describe('searchBySkills', () => {
    it('debe buscar profesionales por skills separadas por coma', async () => {
      // Arrange
      const query = {
        skills: 'plomería, electricidad, pintura',
        page: 1,
      } as never;
      mockSearchBySkills.mockResolvedValue([mockProfessional]);

      // Act
      const result = await service.searchBySkills(query);

      // Assert
      expect(mockSearchBySkills).toHaveBeenCalledWith(
        ['plomería', 'electricidad', 'pintura'],
        query,
      );
      expect(result).toEqual([mockProfessional]);
    });

    it('debe manejar una skill única sin comas', async () => {
      // Arrange
      const query = { skills: 'plomería', page: 1 } as never;
      mockSearchBySkills.mockResolvedValue([]);

      // Act
      await service.searchBySkills(query);

      // Assert
      expect(mockSearchBySkills).toHaveBeenCalledWith(['plomería'], query);
    });
  });

  describe('getTopRatedProfessionals', () => {
    it('debe retornar los profesionales mejor calificados con limit aplicado', async () => {
      // Arrange
      const query = { categoryId: 2, limit: 5 };
      mockGetTopRated.mockResolvedValue([mockProfessional]);

      // Act
      const result = await service.getTopRatedProfessionals(query);

      // Assert
      expect(mockGetTopRated).toHaveBeenCalledWith(
        query.categoryId,
        query.limit,
      );
      expect(result).toEqual([mockProfessional]);
    });
  });

  describe('verifyProfessional', () => {
    it('debe marcar el profesional como verificado cuando isVerified=true', async () => {
      // Arrange
      const dto = { isVerified: true, notes: 'Documentos válidos' } as never;
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue({
        ...mockProfessional,
        verificationStatus: 'verified',
        status: 'APPROVED',
      });

      // Act
      await service.verifyProfessional(1, dto, 99);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          verificationStatus: 'verified',
          status: 'APPROVED',
          changedReason: 'Documentos válidos',
        }),
      );
    });

    it('debe marcar el profesional como rechazado cuando isVerified=false', async () => {
      // Arrange
      const dto = { isVerified: false, notes: 'Documentos inválidos' } as never;
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue(mockProfessional);

      // Act
      await service.verifyProfessional(1, dto, 99);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          verificationStatus: 'rejected',
          status: 'REJECTED',
        }),
      );
    });
  });

  describe('suspendProfessional', () => {
    it('debe suspender el profesional con la razón indicada', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue({
        ...mockProfessional,
        status: 'SUSPENDED',
        isActive: false,
      });

      // Act
      await service.suspendProfessional(1, 'Comportamiento inadecuado', 99);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'SUSPENDED',
          isActive: false,
          changedReason: 'Comportamiento inadecuado',
          lastChangedBy: '99',
        }),
      );
    });
  });
});
