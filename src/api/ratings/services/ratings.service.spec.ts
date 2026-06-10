import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RatingType } from '@prisma/client';
import { RatingsService } from './ratings.service';
import { RatingsDbService } from '@modules/ratings-db/services/ratings-db.service';

const mockFindProfessionalByUserRef = jest.fn();
const mockFindDuplicate = jest.fn();
const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockFindRecent = jest.fn();
const mockFindByUser = jest.fn();
const mockFindByProfessional = jest.fn();
const mockFindClientRatings = jest.fn();
const mockFindProfessionalRatings = jest.fn();
const mockFindByServiceId = jest.fn();
const mockFindById = jest.fn();
const mockUpdate = jest.fn();
const mockDeactivate = jest.fn();
const mockReport = jest.fn();
const mockAggregateUserStats = jest.fn();
const mockGetAggregateAndRatings = jest.fn();
const mockGroupTopRated = jest.fn();

const mockRating = {
  id: 'rating-001',
  userId: 1,
  professionalId: 5,
  serviceId: 'svc-001',
  type: RatingType.CLIENT_TO_PROFESSIONAL,
  rating: 4.5,
  review: 'Excelente trabajo',
  isAnonymous: false,
  isActive: true,
  isReported: false,
  createdAt: new Date('2024-06-01'),
};

describe('RatingsService', () => {
  let service: RatingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: RatingsDbService,
          useValue: {
            findProfessionalByUserRef: mockFindProfessionalByUserRef,
            findDuplicate: mockFindDuplicate,
            create: mockCreate,
            findAll: mockFindAll,
            findRecent: mockFindRecent,
            findByUser: mockFindByUser,
            findByProfessional: mockFindByProfessional,
            findClientRatings: mockFindClientRatings,
            findProfessionalRatings: mockFindProfessionalRatings,
            findByServiceId: mockFindByServiceId,
            findById: mockFindById,
            update: mockUpdate,
            deactivate: mockDeactivate,
            report: mockReport,
            aggregateUserStats: mockAggregateUserStats,
            getAggregateAndRatings: mockGetAggregateAndRatings,
            groupTopRated: mockGroupTopRated,
          },
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('debe crear la calificación cuando no existe una previa para el mismo servicio', async () => {
      // Arrange
      const dto = {
        professionalId: 5,
        type: RatingType.CLIENT_TO_PROFESSIONAL,
        rating: 4.5,
        review: 'Excelente',
        isAnonymous: false,
        serviceId: 'svc-001',
      } as never;
      mockFindDuplicate.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockRating);

      // Act
      const result = await service.create(1, dto);

      // Assert
      expect(mockFindDuplicate).toHaveBeenCalledWith(
        1,
        5,
        'svc-001',
        RatingType.CLIENT_TO_PROFESSIONAL,
      );
      expect(mockCreate).toHaveBeenCalled();
      expect(result).toEqual(mockRating);
    });

    it('debe lanzar BadRequestException cuando ya existe una calificación para el mismo servicio y profesional', async () => {
      // Arrange
      const dto = {
        professionalId: 5,
        type: RatingType.CLIENT_TO_PROFESSIONAL,
        rating: 3,
      } as never;
      mockFindDuplicate.mockResolvedValue(mockRating);

      // Act & Assert
      await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe resolver el professionalId desde referenceId cuando se pasa como string', async () => {
      // Arrange
      const dto = {
        professionalId: 'ref-prof-001',
        type: RatingType.CLIENT_TO_PROFESSIONAL,
        rating: 5,
      } as never;
      mockFindProfessionalByUserRef.mockResolvedValue({ id: 5 });
      mockFindDuplicate.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockRating);

      // Act
      await service.create(1, dto);

      // Assert
      expect(mockFindProfessionalByUserRef).toHaveBeenCalledWith(
        'ref-prof-001',
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las calificaciones con sus relaciones', async () => {
      // Arrange
      mockFindAll.mockResolvedValue([mockRating]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([mockRating]);
      expect(mockFindAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe retornar la calificación cuando el ID existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockRating);

      // Act
      const result = await service.findOne('rating-001');

      // Assert
      expect(result).toEqual(mockRating);
      expect(mockFindById).toHaveBeenCalledWith('rating-001');
    });

    it('debe lanzar NotFoundException cuando la calificación no existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUser', () => {
    it('debe retornar las calificaciones del usuario', async () => {
      // Arrange
      mockFindByUser.mockResolvedValue([mockRating]);

      // Act
      const result = await service.findByUser(1);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockFindByUser).toHaveBeenCalledWith(1);
    });
  });

  describe('findByProfessional', () => {
    it('debe retornar las calificaciones activas del profesional', async () => {
      // Arrange
      mockFindByProfessional.mockResolvedValue([mockRating]);

      // Act
      const result = await service.findByProfessional(5);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockFindByProfessional).toHaveBeenCalledWith(5);
    });
  });

  describe('findClientRatings', () => {
    it('debe retornar solo calificaciones de clientes hacia el profesional', async () => {
      // Arrange
      mockFindClientRatings.mockResolvedValue([mockRating]);

      // Act
      const result = await service.findClientRatings(5);

      // Assert
      expect(result).toBeDefined();
      expect(mockFindClientRatings).toHaveBeenCalledWith(5);
    });
  });

  describe('findProfessionalRatings', () => {
    it('debe retornar solo calificaciones de profesionales hacia usuarios', async () => {
      // Arrange
      mockFindProfessionalRatings.mockResolvedValue([]);

      // Act
      await service.findProfessionalRatings(1);

      // Assert
      expect(mockFindProfessionalRatings).toHaveBeenCalledWith(1);
    });
  });

  describe('findByServiceRequest', () => {
    it('debe retornar las calificaciones de una solicitud de servicio', async () => {
      // Arrange
      mockFindByServiceId.mockResolvedValue([mockRating]);

      // Act
      const result = await service.findByServiceRequest('svc-001');

      // Assert
      expect(result).toHaveLength(1);
      expect(mockFindByServiceId).toHaveBeenCalledWith('svc-001');
    });
  });

  describe('getUserRatingStats', () => {
    it('debe retornar estadísticas con userId como número', async () => {
      // Arrange
      mockAggregateUserStats.mockResolvedValue([
        { _count: { id: 10 }, _avg: { rating: 4.5 } },
        { _count: { id: 5 }, _avg: { rating: 4.2 } },
      ]);

      // Act
      const result = await service.getUserRatingStats(1);

      // Assert
      expect(result.givenRatings).toBe(10);
      expect(result.receivedRatings).toBe(5);
      expect(result.averageGivenRating).toBe(4.5);
      expect(result.averageReceivedRating).toBe(4.2);
    });

    it('debe retornar estadísticas con userId como string numérico', async () => {
      // Arrange
      mockAggregateUserStats.mockResolvedValue([
        { _count: { id: 3 }, _avg: { rating: null } },
        { _count: { id: 0 }, _avg: { rating: null } },
      ]);

      // Act
      const result = await service.getUserRatingStats('1');

      // Assert
      expect(result.averageGivenRating).toBe(0);
      expect(result.averageReceivedRating).toBe(0);
    });
  });

  describe('update', () => {
    it('debe actualizar la calificación cuando el userId coincide y está dentro de la ventana de 24h', async () => {
      // Arrange
      const recentRating = { ...mockRating, createdAt: new Date() };
      mockFindById.mockResolvedValue(recentRating);
      mockUpdate.mockResolvedValue({ ...recentRating, rating: 3 });
      const dto = { rating: 3 } as never;

      // Act
      const result = await service.update('rating-001', 1, dto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith('rating-001', dto);
      expect(result).toBeDefined();
    });

    it('debe lanzar ForbiddenException cuando el userId no es el autor de la calificación', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...mockRating, userId: 99 });

      // Act & Assert
      await expect(service.update('rating-001', 1, {})).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando han pasado más de 24 horas desde la creación', async () => {
      // Arrange
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
      mockFindById.mockResolvedValue({ ...mockRating, createdAt: oldDate });

      // Act & Assert
      await expect(service.update('rating-001', 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('debe desactivar (soft-delete) la calificación dentro de la ventana de 24h', async () => {
      // Arrange
      const recentRating = { ...mockRating, createdAt: new Date() };
      mockFindById.mockResolvedValue(recentRating);
      mockDeactivate.mockResolvedValue(undefined);

      // Act
      await service.remove('rating-001', 1);

      // Assert
      expect(mockDeactivate).toHaveBeenCalledWith('rating-001');
    });

    it('debe lanzar ForbiddenException cuando el userId no es el autor', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...mockRating, userId: 99 });

      // Act & Assert
      await expect(service.remove('rating-001', 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar BadRequestException cuando han pasado más de 24 horas', async () => {
      // Arrange
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
      mockFindById.mockResolvedValue({ ...mockRating, createdAt: oldDate });

      // Act & Assert
      await expect(service.remove('rating-001', 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reportRating', () => {
    it('debe reportar la calificación de otro usuario', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...mockRating, userId: 99 });
      mockReport.mockResolvedValue({ ...mockRating, isReported: true });

      // Act
      const result = await service.reportRating(
        'rating-001',
        1,
        'Contenido inapropiado',
      );

      // Assert
      expect(mockReport).toHaveBeenCalledWith(
        'rating-001',
        'Contenido inapropiado',
      );
      expect(result).toBeDefined();
    });

    it('debe lanzar BadRequestException cuando el usuario intenta reportar su propia calificación', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...mockRating, userId: 1 });

      // Act & Assert
      await expect(
        service.reportRating('rating-001', 1, 'razón'),
      ).rejects.toThrow(BadRequestException);
      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('getAverageRating', () => {
    it('debe retornar el rating promedio cuando hay calificaciones', async () => {
      // Arrange
      mockGetAggregateAndRatings.mockResolvedValue([
        { _avg: { rating: 4.5 }, _count: { id: 10 } },
        [
          { rating: 5, criteria: null },
          { rating: 4, criteria: { puntualidad: 5, calidad: 4 } },
        ],
      ]);

      // Act
      const result = await service.getAverageRating(5);

      // Assert
      expect(result.totalRatings).toBe(10);
      expect(result.averageRating).toBe(4.5);
    });

    it('debe retornar valores en cero cuando no hay calificaciones', async () => {
      // Arrange
      mockGetAggregateAndRatings.mockResolvedValue([
        { _avg: { rating: null }, _count: { id: 0 } },
        [],
      ]);

      // Act
      const result = await service.getAverageRating(5);

      // Assert
      expect(result.averageRating).toBe(0);
      expect(result.totalRatings).toBe(0);
      expect(result.ratingDistribution).toEqual({
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      });
    });
  });

  describe('getTopRatedProfessionals', () => {
    it('debe retornar profesionales ordenados por rating con el limit indicado', async () => {
      // Arrange
      const grouped = [
        { professionalId: 5, _avg: { rating: 4.9 }, _count: { id: 20 } },
        { professionalId: 3, _avg: { rating: 4.7 }, _count: { id: 15 } },
      ];
      mockGroupTopRated.mockResolvedValue(grouped);

      // Act
      const result = await service.getTopRatedProfessionals(5);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        professionalId: '5',
        averageRating: 4.9,
        totalRatings: 20,
      });
      expect(mockGroupTopRated).toHaveBeenCalledWith(5);
    });
  });

  describe('getRecentRatings', () => {
    it('debe retornar las calificaciones más recientes con el limit indicado', async () => {
      // Arrange
      mockFindRecent.mockResolvedValue([mockRating]);

      // Act
      const result = await service.getRecentRatings(20);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockFindRecent).toHaveBeenCalledWith(20);
    });
  });
});
