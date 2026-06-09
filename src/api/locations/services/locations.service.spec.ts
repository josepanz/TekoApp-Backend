import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationsService } from './locations.service';
import { LocationsDbService } from '@modules/locations-db/services/locations-db.service';

const mockFindById = jest.fn();
const mockUpdateLocation = jest.fn();
const mockFindNearby = jest.fn();
const mockCountOnline = jest.fn();
const mockFindMany = jest.fn();
const mockConfigGet = jest.fn();

const mockProfessional = {
  id: 1,
  userId: 10,
  currentLatitude: -25.2867,
  currentLongitude: -57.647,
  lastLocationUpdate: new Date('2024-01-15'),
  isAvailable: true,
  isOnline: true,
};

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: LocationsDbService,
          useValue: {
            findById: mockFindById,
            updateLocation: mockUpdateLocation,
            findNearby: mockFindNearby,
            countOnline: mockCountOnline,
            findMany: mockFindMany,
          },
        },
        {
          provide: ConfigService,
          useValue: { get: mockConfigGet },
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('updateLocation', () => {
    it('debe actualizar la ubicación cuando el profesional existe', async () => {
      // Arrange
      const dto = { latitude: -25.3, longitude: -57.65 };
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdateLocation.mockResolvedValue({
        ...mockProfessional,
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
      });

      // Act
      const result = await service.updateLocation(1, dto);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockUpdateLocation).toHaveBeenCalledWith(
        1,
        dto.latitude,
        dto.longitude,
      );
      expect(result).toBeDefined();
    });

    it('debe lanzar NotFoundException cuando el profesional no existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateLocation(999, {
          latitude: -25.3,
          longitude: -57.65,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockUpdateLocation).not.toHaveBeenCalled();
    });
  });

  describe('findNearbyProfessionals', () => {
    it('debe usar el radio solicitado cuando es menor al máximo configurado', async () => {
      // Arrange
      const dto = { latitude: -25.2867, longitude: -57.647, radius: 5 };
      mockConfigGet.mockReturnValue(50);
      mockFindNearby.mockResolvedValue([mockProfessional]);

      // Act
      const result = await service.findNearbyProfessionals(dto as never);

      // Assert
      expect(mockFindNearby).toHaveBeenCalledWith(
        expect.objectContaining({ radius: 5 }),
      );
      expect(result).toHaveLength(1);
    });

    it('debe limitar el radio al máximo configurado cuando el radio solicitado es mayor', async () => {
      // Arrange
      const dto = { latitude: -25.2867, longitude: -57.647, radius: 200 };
      mockConfigGet.mockReturnValue(50);
      mockFindNearby.mockResolvedValue([]);

      // Act
      await service.findNearbyProfessionals(dto as never);

      // Assert
      expect(mockFindNearby).toHaveBeenCalledWith(
        expect.objectContaining({ radius: 50 }),
      );
    });

    it('debe llamar a locationsDb.findNearby con los demás parámetros del DTO', async () => {
      // Arrange
      const dto = {
        latitude: -25.2867,
        longitude: -57.647,
        radius: 10,
        categoryId: 3,
      };
      mockConfigGet.mockReturnValue(50);
      mockFindNearby.mockResolvedValue([]);

      // Act
      await service.findNearbyProfessionals(dto as never);

      // Assert
      expect(mockFindNearby).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: dto.latitude,
          longitude: dto.longitude,
          categoryId: dto.categoryId,
        }),
      );
    });
  });

  describe('getProfessionalLocation', () => {
    it('debe retornar las coordenadas del profesional cuando tiene ubicación', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.getProfessionalLocation(1);

      // Assert
      expect(result.latitude).toBe(-25.2867);
      expect(result.longitude).toBe(-57.647);
      expect(result.lastUpdate).toEqual(mockProfessional.lastLocationUpdate);
    });

    it('debe lanzar NotFoundException cuando el profesional no existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProfessionalLocation(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar NotFoundException cuando el profesional no tiene coordenadas', async () => {
      // Arrange
      mockFindById.mockResolvedValue({
        id: 2,
        currentLatitude: null,
        currentLongitude: null,
      });

      // Act & Assert
      await expect(service.getProfessionalLocation(2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOnlineProfessionalsCount', () => {
    it('debe retornar el conteo de profesionales online con los filtros correctos', async () => {
      // Arrange
      mockCountOnline.mockResolvedValue(12);

      // Act
      const result = await service.getOnlineProfessionalsCount();

      // Assert
      expect(result).toBe(12);
      expect(mockCountOnline).toHaveBeenCalledWith({
        isOnline: true,
        isAvailable: true,
        status: 'APPROVED',
        verificationStatus: 'verified',
      });
    });
  });

  describe('getProfessionalsByArea', () => {
    it('debe retornar profesionales dentro del área especificada', async () => {
      // Arrange
      const dto = {
        minLat: -25.35,
        maxLat: -25.25,
        minLng: -57.7,
        maxLng: -57.6,
      };
      mockFindMany.mockResolvedValue([mockProfessional]);

      // Act
      const result = await service.getProfessionalsByArea(dto);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          currentLatitude: { gte: dto.minLat, lte: dto.maxLat },
          currentLongitude: { gte: dto.minLng, lte: dto.maxLng },
          isAvailable: true,
          isOnline: true,
        }) as unknown,
      });
    });
  });

  describe('calculateDistance', () => {
    it('debe retornar 0 cuando los dos puntos son iguales', () => {
      // Arrange
      const dto = {
        lat1: -25.2867,
        lng1: -57.647,
        lat2: -25.2867,
        lng2: -57.647,
      } as never;

      // Act
      const result = service.calculateDistance(dto);

      // Assert
      expect(result).toBe(0);
    });

    it('debe calcular una distancia positiva entre dos puntos distintos', () => {
      // Arrange — Asunción y Fernando de la Mora (~5.5km aprox)
      const dto = {
        lat1: -25.2867,
        lng1: -57.647,
        lat2: -25.33,
        lng2: -57.62,
      } as never;

      // Act
      const result = service.calculateDistance(dto);

      // Assert
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(5.5, 0);
    });

    it('debe calcular la distancia en kilómetros usando fórmula de Haversine', () => {
      // Arrange — distancia conocida aprox entre dos puntos en Paraguay
      const dto = {
        lat1: -25.2867,
        lng1: -57.647,
        lat2: -25.5,
        lng2: -57.5,
      } as never;

      // Act
      const result = service.calculateDistance(dto);

      // Assert — resultado debe ser un número finito positivo
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });
  });
});
