import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RatingsController } from './ratings.controller';
import { RatingsService } from '../services/ratings.service';
import {
  CreateRatingRequestDTO,
  CreateProfessionalToClientRatingRequestDTO,
  UpdateRatingRequestDTO,
} from '../dtos/request';

const mockCreate = jest.fn();
const mockCreateProfessionalToClientRating = jest.fn();
const mockFindAll = jest.fn();
const mockGetRecentRatings = jest.fn();
const mockGetTopRatedProfessionals = jest.fn();
const mockFindByUser = jest.fn();
const mockGetUserRatingStats = jest.fn();
const mockFindByProfessional = jest.fn();
const mockFindClientRatings = jest.fn();
const mockGetAverageRating = jest.fn();
const mockFindByServiceRequest = jest.fn();
const mockFindOne = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
const mockReportRating = jest.fn();

const mockReq = { user: { id: 1 } };
const mockRatingIdParam = { id: 'rating-uuid-001' };
const mockUserIdParam = { userId: 5 };
const mockProfessionalIdParam = {
  professionalId: 10,
};
const mockServiceRequestIdParam = {
  serviceRequestId: 'service-uuid-001',
};

describe('RatingsController', () => {
  let controller: RatingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [
        {
          provide: RatingsService,
          useValue: {
            create: mockCreate,
            createProfessionalToClientRating:
              mockCreateProfessionalToClientRating,
            findAll: mockFindAll,
            getRecentRatings: mockGetRecentRatings,
            getTopRatedProfessionals: mockGetTopRatedProfessionals,
            findByUser: mockFindByUser,
            getUserRatingStats: mockGetUserRatingStats,
            findByProfessional: mockFindByProfessional,
            findClientRatings: mockFindClientRatings,
            getAverageRating: mockGetAverageRating,
            findByServiceRequest: mockFindByServiceRequest,
            findOne: mockFindOne,
            update: mockUpdate,
            remove: mockRemove,
            reportRating: mockReportRating,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<RatingsController>(RatingsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('debe crear una calificación pasando el userId del token', async () => {
      // Arrange
      const dto = {
        rating: 5,
        type: 'CLIENT_TO_PROFESSIONAL',
      } as unknown as CreateRatingRequestDTO;
      const expected = { id: 'rating-uuid-001', rating: 5, userId: 1 };
      mockCreate.mockResolvedValue(expected);

      // Act
      const result = await controller.create(mockReq, dto);

      // Assert
      expect(result).toEqual(expected);
      expect(mockCreate).toHaveBeenCalledWith(1, dto);
    });

    it('debe propagar BadRequestException si ya existe una calificación', async () => {
      // Arrange
      mockCreate.mockRejectedValue(
        new BadRequestException('Ya has calificado este servicio'),
      );

      // Act & Assert
      await expect(
        controller.create(mockReq, {} as CreateRatingRequestDTO),
      ).rejects.toThrow('Ya has calificado este servicio');
    });
  });

  describe('createProfessionalToClientRating', () => {
    it('debe crear la calificación profesional→cliente pasando el userId del token', async () => {
      // Arrange
      const dto = {
        clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        serviceRequestId: 'svc-001',
        rating: 5,
      } as unknown as CreateProfessionalToClientRatingRequestDTO;
      const expected = { id: 'rating-uuid-002', rating: 5 };
      mockCreateProfessionalToClientRating.mockResolvedValue(expected);

      // Act
      const result = await controller.createProfessionalToClientRating(
        mockReq,
        dto,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockCreateProfessionalToClientRating).toHaveBeenCalledWith(1, dto);
    });

    it('debe propagar ForbiddenException si el usuario no tiene perfil profesional', async () => {
      // Arrange
      mockCreateProfessionalToClientRating.mockRejectedValue(
        new ForbiddenException(
          'Solo un profesional puede calificar a un cliente',
        ),
      );

      // Act & Assert
      await expect(
        controller.createProfessionalToClientRating(
          mockReq,
          {} as CreateProfessionalToClientRatingRequestDTO,
        ),
      ).rejects.toThrow('Solo un profesional puede calificar a un cliente');
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las calificaciones', async () => {
      // Arrange
      const expected = [{ id: 'uuid-1', rating: 4 }];
      mockFindAll.mockResolvedValue(expected);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindAll).toHaveBeenCalled();
    });
  });

  describe('getRecentRatings', () => {
    it('debe retornar las calificaciones recientes con el límite indicado', async () => {
      // Arrange
      const query = { limit: 10 };
      const expected = [{ id: 'uuid-1' }, { id: 'uuid-2' }];
      mockGetRecentRatings.mockResolvedValue(expected);

      // Act
      const result = await controller.getRecentRatings(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetRecentRatings).toHaveBeenCalledWith(10);
    });
  });

  describe('getTopRatedProfessionals', () => {
    it('debe retornar los profesionales mejor calificados según el límite', async () => {
      // Arrange
      const query = { limit: 5 };
      const expected = [
        { professionalId: '10', averageRating: 4.9, totalRatings: 20 },
      ];
      mockGetTopRatedProfessionals.mockResolvedValue(expected);

      // Act
      const result = await controller.getTopRatedProfessionals(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetTopRatedProfessionals).toHaveBeenCalledWith(5);
    });
  });

  describe('findByUser', () => {
    it('debe retornar las calificaciones del usuario indicado', async () => {
      // Arrange
      const expected = [{ id: 'uuid-1', userId: 5 }];
      mockFindByUser.mockResolvedValue(expected);

      // Act
      const result = await controller.findByUser(mockUserIdParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindByUser).toHaveBeenCalledWith(5);
    });
  });

  describe('getUserRatingStats', () => {
    it('debe retornar las estadísticas de calificación del usuario convirtiendo el ID a string', async () => {
      // Arrange
      const expected = {
        givenRatings: 10,
        receivedRatings: 8,
        averageGivenRating: 4.5,
        averageReceivedRating: 4.8,
      };
      mockGetUserRatingStats.mockResolvedValue(expected);

      // Act
      const result = await controller.getUserRatingStats(mockUserIdParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetUserRatingStats).toHaveBeenCalledWith('5');
    });
  });

  describe('findByProfessional', () => {
    it('debe retornar las calificaciones del profesional indicado', async () => {
      // Arrange
      const expected = [{ id: 'uuid-1', professionalId: 10 }];
      mockFindByProfessional.mockResolvedValue(expected);

      // Act
      const result = await controller.findByProfessional(
        mockProfessionalIdParam,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindByProfessional).toHaveBeenCalledWith(10);
    });
  });

  describe('getClientRatings', () => {
    it('debe retornar las calificaciones de clientes al profesional', async () => {
      // Arrange
      const expected = [{ id: 'uuid-1', type: 'CLIENT_TO_PROFESSIONAL' }];
      mockFindClientRatings.mockResolvedValue(expected);

      // Act
      const result = await controller.getClientRatings(mockProfessionalIdParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindClientRatings).toHaveBeenCalledWith(10);
    });
  });

  describe('getAverageRating', () => {
    it('debe retornar el promedio de calificaciones del profesional', async () => {
      // Arrange
      const expected = {
        averageRating: 4.7,
        totalRatings: 30,
        ratingDistribution: { '1': 0, '2': 1, '3': 2, '4': 10, '5': 17 },
        averageCriteria: {},
      };
      mockGetAverageRating.mockResolvedValue(expected);

      // Act
      const result = await controller.getAverageRating(mockProfessionalIdParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetAverageRating).toHaveBeenCalledWith(10);
    });
  });

  describe('findByServiceRequest', () => {
    it('debe retornar las calificaciones de la solicitud de servicio indicada', async () => {
      // Arrange
      const expected = [{ id: 'uuid-1', serviceId: 'service-uuid-001' }];
      mockFindByServiceRequest.mockResolvedValue(expected);

      // Act
      const result = await controller.findByServiceRequest(
        mockServiceRequestIdParam,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindByServiceRequest).toHaveBeenCalledWith('service-uuid-001');
    });
  });

  describe('findOne', () => {
    it('debe retornar la calificación por su ID', async () => {
      // Arrange
      const expected = { id: 'rating-uuid-001', rating: 5 };
      mockFindOne.mockResolvedValue(expected);

      // Act
      const result = await controller.findOne(mockRatingIdParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindOne).toHaveBeenCalledWith('rating-uuid-001');
    });

    it('debe propagar NotFoundException si la calificación no existe', async () => {
      // Arrange
      mockFindOne.mockRejectedValue(
        new NotFoundException('Calificación no encontrada'),
      );

      // Act & Assert
      await expect(controller.findOne(mockRatingIdParam)).rejects.toThrow(
        'Calificación no encontrada',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar la calificación verificando que el userId del token sea el propietario', async () => {
      // Arrange
      const dto = { rating: 4 } as unknown as UpdateRatingRequestDTO;
      const expected = { id: 'rating-uuid-001', rating: 4 };
      mockUpdate.mockResolvedValue(expected);

      // Act
      const result = await controller.update(mockRatingIdParam, mockReq, dto);

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdate).toHaveBeenCalledWith('rating-uuid-001', 1, dto);
    });

    it('debe propagar ForbiddenException si el usuario no es el propietario', async () => {
      // Arrange
      mockUpdate.mockRejectedValue(
        new ForbiddenException('No puedes editar esta calificación'),
      );

      // Act & Assert
      await expect(
        controller.update(mockRatingIdParam, mockReq, {}),
      ).rejects.toThrow('No puedes editar esta calificación');
    });
  });

  describe('remove', () => {
    it('debe eliminar (soft delete) la calificación verificando que el userId sea el propietario', async () => {
      // Arrange
      mockRemove.mockResolvedValue(undefined);

      // Act
      await controller.remove(mockRatingIdParam, mockReq);

      // Assert
      expect(mockRemove).toHaveBeenCalledWith('rating-uuid-001', 1);
    });

    it('debe propagar BadRequestException si el período de edición expiró', async () => {
      // Arrange
      mockRemove.mockRejectedValue(
        new BadRequestException('No se puede eliminar esta calificación'),
      );

      // Act & Assert
      await expect(
        controller.remove(mockRatingIdParam, mockReq),
      ).rejects.toThrow('No se puede eliminar esta calificación');
    });
  });

  describe('reportRating', () => {
    it('debe reportar la calificación extrayendo la razón del DTO', async () => {
      // Arrange
      const dto = { reason: 'Contenido inapropiado' };
      const expected = { id: 'rating-uuid-001', isReported: true };
      mockReportRating.mockResolvedValue(expected);

      // Act
      const result = await controller.reportRating(
        mockRatingIdParam,
        mockReq,
        dto,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockReportRating).toHaveBeenCalledWith(
        'rating-uuid-001',
        1,
        'Contenido inapropiado',
      );
    });
  });
});
