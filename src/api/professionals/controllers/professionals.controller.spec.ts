import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from '../services/professionals.service';
import {
  GetProfessionalsListQueryDTO,
  GetNearbyProfessionalsQueryDTO,
  SearchBySkillsQueryDTO,
  GetTopRatedQueryDTO,
  GetProfessionalServicesQueryDTO,
  GetProfessionalReviewsQueryDTO,
  CreateProfessionalRequestDTO,
  UpdateProfessionalRequestDTO,
  UpdateAvailabilityRequestDTO,
  VerifyProfessionalRequestDTO,
} from '../dtos/request';

const mockRegisterProfessional = jest.fn();
const mockGetProfessionals = jest.fn();
const mockGetNearbyProfessionals = jest.fn();
const mockSearchBySkills = jest.fn();
const mockGetTopRatedProfessionals = jest.fn();
const mockGetProfessionalById = jest.fn();
const mockUpdateProfessional = jest.fn();
const mockUpdateAvailability = jest.fn();
const mockUpdateLocation = jest.fn();
const mockGetProfessionalServices = jest.fn();
const mockGetProfessionalReviews = jest.fn();
const mockGetProfessionalStats = jest.fn();
const mockVerifyProfessional = jest.fn();
const mockSuspendProfessional = jest.fn();

const mockUser = { id: 1 } as unknown as IUserDataOnJwt;
const mockReq = { user: mockUser };
const mockParam = { id: 10 };

describe('ProfessionalsController', () => {
  let controller: ProfessionalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfessionalsController],
      providers: [
        {
          provide: ProfessionalsService,
          useValue: {
            registerProfessional: mockRegisterProfessional,
            getProfessionals: mockGetProfessionals,
            getNearbyProfessionals: mockGetNearbyProfessionals,
            searchBySkills: mockSearchBySkills,
            getTopRatedProfessionals: mockGetTopRatedProfessionals,
            getProfessionalById: mockGetProfessionalById,
            updateProfessional: mockUpdateProfessional,
            updateAvailability: mockUpdateAvailability,
            updateLocation: mockUpdateLocation,
            getProfessionalServices: mockGetProfessionalServices,
            getProfessionalReviews: mockGetProfessionalReviews,
            getProfessionalStats: mockGetProfessionalStats,
            verifyProfessional: mockVerifyProfessional,
            suspendProfessional: mockSuspendProfessional,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ProfessionalsController>(ProfessionalsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('registerProfessional', () => {
    it('debe registrar el profesional pasando el userId del token', async () => {
      // Arrange
      const dto = {
        bio: 'Electricista certificado',
      } as unknown as CreateProfessionalRequestDTO;
      const expected = { id: 10, userId: 1, bio: 'Electricista certificado' };
      mockRegisterProfessional.mockResolvedValue(expected);

      // Act
      const result = await controller.registerProfessional(dto, mockReq);

      // Assert
      expect(result).toEqual(expected);
      expect(mockRegisterProfessional).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('getProfessionals', () => {
    it('debe retornar la lista paginada de profesionales según filtros', async () => {
      // Arrange
      const query = {
        page: 1,
        pageSize: 10,
      } as unknown as GetProfessionalsListQueryDTO;
      const expected = {
        data: [{ id: 1 }],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      };
      mockGetProfessionals.mockResolvedValue(expected);

      // Act
      const result = await controller.getProfessionals(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetProfessionals).toHaveBeenCalledWith(query);
    });
  });

  describe('getNearbyProfessionals', () => {
    it('debe retornar profesionales cercanos a las coordenadas indicadas', async () => {
      // Arrange
      const query = {
        latitude: -25.3,
        longitude: -57.6,
        radius: 10,
      } as unknown as GetNearbyProfessionalsQueryDTO;
      const expected = [{ id: 5, name: 'Pedro' }];
      mockGetNearbyProfessionals.mockResolvedValue(expected);

      // Act
      const result = await controller.getNearbyProfessionals(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetNearbyProfessionals).toHaveBeenCalledWith(query);
    });
  });

  describe('searchBySkills', () => {
    it('debe buscar profesionales por habilidades específicas', async () => {
      // Arrange
      const query = {
        skills: ['electricidad', 'plomería'],
      } as unknown as SearchBySkillsQueryDTO;
      const expected = {
        data: [{ id: 3 }],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      };
      mockSearchBySkills.mockResolvedValue(expected);

      // Act
      const result = await controller.searchBySkills(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockSearchBySkills).toHaveBeenCalledWith(query);
    });
  });

  describe('getTopRatedProfessionals', () => {
    it('debe retornar los profesionales mejor calificados', async () => {
      // Arrange
      const query = { limit: 5 } as unknown as GetTopRatedQueryDTO;
      const expected = [{ id: 1, averageRating: 4.9 }];
      mockGetTopRatedProfessionals.mockResolvedValue(expected);

      // Act
      const result = await controller.getTopRatedProfessionals(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetTopRatedProfessionals).toHaveBeenCalledWith(query);
    });
  });

  describe('getProfessionalById', () => {
    it('debe retornar el detalle del profesional por su ID', async () => {
      // Arrange
      const expected = { id: 10, name: 'Carlos', bio: 'Plomero' };
      mockGetProfessionalById.mockResolvedValue(expected);

      // Act
      const result = await controller.getProfessionalById(mockParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetProfessionalById).toHaveBeenCalledWith(10);
    });

    it('debe propagar NotFoundException si el profesional no existe', async () => {
      // Arrange
      mockGetProfessionalById.mockRejectedValue(
        new NotFoundException('Profesional no encontrado'),
      );

      // Act & Assert
      await expect(controller.getProfessionalById(mockParam)).rejects.toThrow(
        'Profesional no encontrado',
      );
    });
  });

  describe('updateProfessional', () => {
    it('debe actualizar el perfil del profesional pasando su ID y el userId del token', async () => {
      // Arrange
      const dto = {
        bio: 'Actualizado',
      } as unknown as UpdateProfessionalRequestDTO;
      const expected = { id: 10, bio: 'Actualizado' };
      mockUpdateProfessional.mockResolvedValue(expected);

      // Act
      const result = await controller.updateProfessional(
        mockParam,
        dto,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdateProfessional).toHaveBeenCalledWith(10, dto, 1);
    });
  });

  describe('updateAvailability', () => {
    it('debe actualizar la disponibilidad extrayendo isAvailable del DTO', async () => {
      // Arrange
      const dto = { isAvailable: true } as UpdateAvailabilityRequestDTO;
      const expected = { id: 10, isAvailable: true };
      mockUpdateAvailability.mockResolvedValue(expected);

      // Act
      const result = await controller.updateAvailability(
        mockParam,
        dto,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdateAvailability).toHaveBeenCalledWith(10, true, 1);
    });
  });

  describe('updateLocation', () => {
    it('debe actualizar la ubicación del profesional', async () => {
      // Arrange
      const dto = {
        latitude: -25.3,
        longitude: -57.6,
      };
      const expected = { id: 10, latitude: -25.3 };
      mockUpdateLocation.mockResolvedValue(expected);

      // Act
      const result = await controller.updateLocation(mockParam, dto, mockReq);

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdateLocation).toHaveBeenCalledWith(10, dto, 1);
    });
  });

  describe('getProfessionalServices', () => {
    it('debe retornar los servicios asociados al profesional', async () => {
      // Arrange
      const query = {} as GetProfessionalServicesQueryDTO;
      const expected = { data: [{ id: 5, title: 'Reparación eléctrica' }] };
      mockGetProfessionalServices.mockResolvedValue(expected);

      // Act
      const result = await controller.getProfessionalServices(mockParam, query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetProfessionalServices).toHaveBeenCalledWith(10, query);
    });
  });

  describe('getProfessionalReviews', () => {
    it('debe retornar las reseñas del profesional', async () => {
      // Arrange
      const query = {} as GetProfessionalReviewsQueryDTO;
      const expected = { data: [{ id: 1, rating: 5 }] };
      mockGetProfessionalReviews.mockResolvedValue(expected);

      // Act
      const result = await controller.getProfessionalReviews(mockParam, query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetProfessionalReviews).toHaveBeenCalledWith(10, query);
    });
  });

  describe('getProfessionalStats', () => {
    it('debe retornar las estadísticas del profesional', async () => {
      // Arrange
      const expected = {
        totalServices: 50,
        completedServices: 45,
        cancelledServices: 5,
      };
      mockGetProfessionalStats.mockResolvedValue(expected);

      // Act
      const result = await controller.getProfessionalStats(mockParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetProfessionalStats).toHaveBeenCalledWith(10);
    });
  });

  describe('verifyProfessional', () => {
    it('debe verificar el profesional con el DTO de verificación y el userId del token', async () => {
      // Arrange
      const dto = {
        documentUrl: 'https://s3.example.com/doc.pdf',
      } as unknown as VerifyProfessionalRequestDTO;
      const expected = { id: 10, isVerified: true };
      mockVerifyProfessional.mockResolvedValue(expected);

      // Act
      const result = await controller.verifyProfessional(
        mockParam,
        dto,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockVerifyProfessional).toHaveBeenCalledWith(10, dto, 1);
    });
  });

  describe('suspendProfessional', () => {
    it('debe suspender el profesional extrayendo la razón del DTO', async () => {
      // Arrange
      const dto = {
        reason: 'Comportamiento inapropiado',
      };
      const expected = { id: 10, isSuspended: true };
      mockSuspendProfessional.mockResolvedValue(expected);

      // Act
      const result = await controller.suspendProfessional(
        mockParam,
        dto,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockSuspendProfessional).toHaveBeenCalledWith(
        10,
        'Comportamiento inapropiado',
        1,
      );
    });
  });
});
