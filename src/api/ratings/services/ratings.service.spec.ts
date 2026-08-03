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
const mockFindProfessionalByUserId = jest.fn();
const mockFindUserByReferenceId = jest.fn();
const mockFindServiceByReferenceId = jest.fn();
const mockFindDuplicate = jest.fn();
const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockFindRecent = jest.fn();
const mockFindByUser = jest.fn();
const mockFindByProfessional = jest.fn();
const mockFindClientRatings = jest.fn();
const mockFindProfessionalRatings = jest.fn();
const mockFindByServiceId = jest.fn();
const mockFindByReferenceId = jest.fn();
const mockUpdate = jest.fn();
const mockDeactivate = jest.fn();
const mockReport = jest.fn();
const mockAggregateUserStats = jest.fn();
const mockGetAggregateAndRatings = jest.fn();
const mockGroupTopRated = jest.fn();

// PK interna (Int) vs UUID público (referenceId, lo que viaja en la wire API).
const RATING_REF = 'rating-001';
const RATING_PK = 1;
const SERVICE_REF = 'svc-001';
const SERVICE_PK = 30;

const mockRating = {
  id: RATING_PK,
  referenceId: RATING_REF,
  userId: 1,
  professionalId: 5,
  serviceId: SERVICE_PK,
  service: { referenceId: SERVICE_REF },
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
            findProfessionalByUserId: mockFindProfessionalByUserId,
            findUserByReferenceId: mockFindUserByReferenceId,
            findServiceByReferenceId: mockFindServiceByReferenceId,
            findDuplicate: mockFindDuplicate,
            create: mockCreate,
            findAll: mockFindAll,
            findRecent: mockFindRecent,
            findByUser: mockFindByUser,
            findByProfessional: mockFindByProfessional,
            findClientRatings: mockFindClientRatings,
            findProfessionalRatings: mockFindProfessionalRatings,
            findByServiceId: mockFindByServiceId,
            findByReferenceId: mockFindByReferenceId,
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
    it('debe crear la calificación resolviendo el servicio (UUID→PK) cuando no existe una previa', async () => {
      // Arrange
      const dto = {
        professionalId: 5,
        type: RatingType.CLIENT_TO_PROFESSIONAL,
        rating: 4.5,
        review: 'Excelente',
        isAnonymous: false,
        serviceId: SERVICE_REF,
      } as never;
      mockFindServiceByReferenceId.mockResolvedValue({ id: SERVICE_PK });
      mockFindDuplicate.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockRating);

      // Act
      const result = await service.create(1, dto);

      // Assert
      expect(mockFindServiceByReferenceId).toHaveBeenCalledWith(SERVICE_REF);
      expect(mockFindDuplicate).toHaveBeenCalledWith(
        1,
        5,
        SERVICE_PK,
        RatingType.CLIENT_TO_PROFESSIONAL,
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: SERVICE_PK }),
      );
      expect(result.id).toBe(RATING_REF);
      expect(result.serviceId).toBe(SERVICE_REF);
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

  describe('createProfessionalToClientRating', () => {
    const dto = {
      clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      serviceRequestId: SERVICE_REF,
      rating: 5,
      comment: 'Cliente puntual',
    } as never;

    it('debe crear la calificación profesional→cliente cuando no existe una previa', async () => {
      // Arrange
      mockFindProfessionalByUserId.mockResolvedValue({ id: 5 });
      mockFindUserByReferenceId.mockResolvedValue({ id: 1 });
      mockFindServiceByReferenceId.mockResolvedValue({ id: SERVICE_PK });
      mockFindDuplicate.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        ...mockRating,
        type: RatingType.PROFESSIONAL_TO_CLIENT,
      });

      // Act
      const result = await service.createProfessionalToClientRating(10, dto);

      // Assert
      expect(mockFindProfessionalByUserId).toHaveBeenCalledWith(10);
      expect(mockFindUserByReferenceId).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );
      expect(mockFindDuplicate).toHaveBeenCalledWith(
        1,
        5,
        SERVICE_PK,
        RatingType.PROFESSIONAL_TO_CLIENT,
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          professionalId: 5,
          serviceId: SERVICE_PK,
          type: RatingType.PROFESSIONAL_TO_CLIENT,
        }),
      );
      expect(result).toBeDefined();
    });

    it('debe lanzar ForbiddenException cuando el usuario autenticado no es profesional', async () => {
      // Arrange
      mockFindProfessionalByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createProfessionalToClientRating(10, dto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException cuando el cliente no existe', async () => {
      // Arrange
      mockFindProfessionalByUserId.mockResolvedValue({ id: 5 });
      mockFindUserByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createProfessionalToClientRating(10, dto),
      ).rejects.toThrow(NotFoundException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando ya existe una calificación para el mismo servicio', async () => {
      // Arrange
      mockFindProfessionalByUserId.mockResolvedValue({ id: 5 });
      mockFindUserByReferenceId.mockResolvedValue({ id: 1 });
      mockFindServiceByReferenceId.mockResolvedValue({ id: SERVICE_PK });
      mockFindDuplicate.mockResolvedValue(mockRating);

      // Act & Assert
      await expect(
        service.createProfessionalToClientRating(10, dto),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las calificaciones con sus relaciones', async () => {
      // Arrange
      mockFindAll.mockResolvedValue([mockRating]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(RATING_REF);
      expect(mockFindAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe resolver la calificación por su referenceId y exponerla bajo la clave id', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(mockRating);

      // Act
      const result = await service.findOne(RATING_REF);

      // Assert
      expect(result.id).toBe(RATING_REF);
      expect(mockFindByReferenceId).toHaveBeenCalledWith(RATING_REF);
    });

    it('debe lanzar NotFoundException cuando la calificación no existe', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(null);

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
    it('debe resolver el servicio por UUID y retornar sus calificaciones', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({ id: SERVICE_PK });
      mockFindByServiceId.mockResolvedValue([mockRating]);

      // Act
      const result = await service.findByServiceRequest(SERVICE_REF);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockFindServiceByReferenceId).toHaveBeenCalledWith(SERVICE_REF);
      expect(mockFindByServiceId).toHaveBeenCalledWith(SERVICE_PK);
    });

    it('debe lanzar NotFoundException cuando el servicio no existe', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByServiceRequest('no-existe')).rejects.toThrow(
        NotFoundException,
      );
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
    it('debe actualizar la calificación (por PK interna) cuando el userId coincide y está dentro de la ventana de 24h', async () => {
      // Arrange
      const recentRating = { ...mockRating, createdAt: new Date() };
      mockFindByReferenceId.mockResolvedValue(recentRating);
      mockUpdate.mockResolvedValue({ ...recentRating, rating: 3 });
      const dto = { rating: 3 } as never;

      // Act
      const result = await service.update(RATING_REF, 1, dto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(RATING_PK, dto);
      expect(result).toBeDefined();
    });

    it('debe lanzar ForbiddenException cuando el userId no es el autor de la calificación', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({ ...mockRating, userId: 99 });

      // Act & Assert
      await expect(service.update(RATING_REF, 1, {})).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando han pasado más de 24 horas desde la creación', async () => {
      // Arrange
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
      mockFindByReferenceId.mockResolvedValue({
        ...mockRating,
        createdAt: oldDate,
      });

      // Act & Assert
      await expect(service.update(RATING_REF, 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('debe desactivar (soft-delete) la calificación dentro de la ventana de 24h', async () => {
      // Arrange
      const recentRating = { ...mockRating, createdAt: new Date() };
      mockFindByReferenceId.mockResolvedValue(recentRating);
      mockDeactivate.mockResolvedValue(undefined);

      // Act
      await service.remove(RATING_REF, 1);

      // Assert
      expect(mockDeactivate).toHaveBeenCalledWith(RATING_PK);
    });

    it('debe lanzar ForbiddenException cuando el userId no es el autor', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({ ...mockRating, userId: 99 });

      // Act & Assert
      await expect(service.remove(RATING_REF, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar BadRequestException cuando han pasado más de 24 horas', async () => {
      // Arrange
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
      mockFindByReferenceId.mockResolvedValue({
        ...mockRating,
        createdAt: oldDate,
      });

      // Act & Assert
      await expect(service.remove(RATING_REF, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reportRating', () => {
    it('debe reportar la calificación de otro usuario (por PK interna)', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({ ...mockRating, userId: 99 });
      mockReport.mockResolvedValue({ ...mockRating, isReported: true });

      // Act
      const result = await service.reportRating(
        RATING_REF,
        1,
        'Contenido inapropiado',
      );

      // Assert
      expect(mockReport).toHaveBeenCalledWith(
        RATING_PK,
        'Contenido inapropiado',
      );
      expect(result).toBeDefined();
    });

    it('debe lanzar BadRequestException cuando el usuario intenta reportar su propia calificación', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({ ...mockRating, userId: 1 });

      // Act & Assert
      await expect(
        service.reportRating(RATING_REF, 1, 'razón'),
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
