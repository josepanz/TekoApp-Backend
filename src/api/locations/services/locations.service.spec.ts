import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationsService } from './locations.service';
import { haversineKm } from '../helpers/location-obfuscation.helper';
import { ProfessionalPositionDbService } from '@modules/professional-position-db/services/professional-position-db.service';

const mockFindById = jest.fn();
const mockUpdateLocation = jest.fn();
const mockFindNearby = jest.fn();
const mockCountOnline = jest.fn();
const mockFindMany = jest.fn();
const mockFindByUserReferenceId = jest.fn();
const mockSetOnlineStatus = jest.fn();
const mockConfigGet = jest.fn();
const mockHasActiveServiceWith = jest.fn();
const mockUserHasPermission = jest.fn();

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
          provide: ProfessionalPositionDbService,
          useValue: {
            findById: mockFindById,
            updateLocation: mockUpdateLocation,
            findNearby: mockFindNearby,
            countOnline: mockCountOnline,
            findMany: mockFindMany,
            findByUserReferenceId: mockFindByUserReferenceId,
            setOnlineStatus: mockSetOnlineStatus,
            hasActiveServiceWith: mockHasActiveServiceWith,
            userHasPermission: mockUserHasPermission,
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

  // Fila cruda de Postgres tal como la devuelve $queryRaw (snake_case, NUMERIC como string) —
  // ver `NearbyProfessionalRow`. El service debe mapearla a `NearbyProfessionalResponseDTO`.
  const rawNearbyRow = {
    id: 1,
    reference_id: 'prof-ref-1',
    category_id: 3,
    description: 'Plomero',
    hourly_rate: '50000.00',
    current_latitude: '-25.2867000',
    current_longitude: '-57.6470000',
    is_available: true,
    is_online: true,
    average_rating: '4.50',
    distance: 1.234,
  };

  describe('findNearbyProfessionals', () => {
    it('debe devolver posición aproximada (nunca la exacta) y distancia recalculada', async () => {
      // Arrange
      const dto = { latitude: -25.2867, longitude: -57.647, radius: 5 };
      mockConfigGet.mockImplementation((k: string) =>
        k === 'MAX_RADIUS_KM' ? 50 : 'test-secret',
      );
      mockFindNearby.mockResolvedValue([rawNearbyRow]);

      // Act
      const result = await service.findNearbyProfessionals(dto as never);

      // Assert
      expect(result).toHaveLength(1);
      const [item] = result;
      expect(item.id).toBe(1);
      expect(item.referenceId).toBe('prof-ref-1');
      expect(item.hourlyRate).toBe(50000);
      expect(item.latitude).not.toBe(Number(rawNearbyRow.current_latitude));
      expect(item.longitude).not.toBe(Number(rawNearbyRow.current_longitude));
      expect(Object.keys(item)).not.toContain('distance');
      const expected =
        Math.round(
          haversineKm(
            dto.latitude,
            dto.longitude,
            item.latitude,
            item.longitude,
          ) * 100,
        ) / 100;
      expect(item.distanceKm).toBe(expected);
    });

    it('debe forzar onlineOnly=true aunque el cliente mande false', async () => {
      // Arrange
      const dto = {
        latitude: -25.2867,
        longitude: -57.647,
        radius: 5,
        onlineOnly: false,
      };
      mockConfigGet.mockImplementation((k: string) =>
        k === 'MAX_RADIUS_KM' ? 50 : 'test-secret',
      );
      mockFindNearby.mockResolvedValue([]);

      // Act
      await service.findNearbyProfessionals(dto as never);

      // Assert
      expect(mockFindNearby).toHaveBeenCalledWith(
        expect.objectContaining({ onlineOnly: true }),
      );
    });

    it('debe usar el radio solicitado cuando es menor al máximo configurado', async () => {
      // Arrange
      const dto = { latitude: -25.2867, longitude: -57.647, radius: 5 };
      mockConfigGet.mockImplementation((k: string) =>
        k === 'MAX_RADIUS_KM' ? 50 : 'test-secret',
      );
      mockFindNearby.mockResolvedValue([rawNearbyRow]);

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
      mockConfigGet.mockImplementation((k: string) =>
        k === 'MAX_RADIUS_KM' ? 50 : 'test-secret',
      );
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
      mockConfigGet.mockImplementation((k: string) =>
        k === 'MAX_RADIUS_KM' ? 50 : 'test-secret',
      );
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
        verificationStatus: 'VERIFIED',
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
      mockConfigGet.mockReturnValue('test-secret');
      mockFindMany.mockResolvedValue([
        {
          ...mockProfessional,
          referenceId: 'prof-ref-1',
          categoryId: 3,
          description: 'Plomero',
          hourlyRate: '50000',
          averageRating: '4.5',
          skills: ['x'],
        },
      ]);

      // Act
      const result = await service.getProfessionalsByArea(dto);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].latitude).not.toBe(mockProfessional.currentLatitude);
      expect(result[0].longitude).not.toBe(mockProfessional.currentLongitude);
      // allowlist: nada de la entidad completa (userId, skills, currentLatitude...)
      expect(Object.keys(result[0]).sort()).toEqual(
        [
          'averageRating',
          'categoryId',
          'description',
          'hourlyRate',
          'id',
          'isAvailable',
          'isOnline',
          'latitude',
          'longitude',
          'referenceId',
        ].sort(),
      );
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

  describe('setOnlineStatus', () => {
    it('debe resolver el professionalId y actualizar su estado online', async () => {
      // Arrange
      mockFindByUserReferenceId.mockResolvedValue({ id: 42 });
      const expected = { id: 42, isOnline: true };
      mockSetOnlineStatus.mockResolvedValue(expected);

      // Act
      const result = await service.setOnlineStatus('user-ref-1', true);

      // Assert
      expect(result).toEqual(expected);
      expect(mockSetOnlineStatus).toHaveBeenCalledWith(42, true);
    });
  });

  describe('resolveProfessionalIdByUserRef', () => {
    it('debe retornar el id del profesional asociado al referenceId del usuario', async () => {
      // Arrange
      mockFindByUserReferenceId.mockResolvedValue({ id: 42 });

      // Act
      const result = await service.resolveProfessionalIdByUserRef('user-ref-1');

      // Assert
      expect(result).toBe(42);
      expect(mockFindByUserReferenceId).toHaveBeenCalledWith('user-ref-1');
    });

    it('debe lanzar NotFoundException si el usuario no tiene perfil profesional', async () => {
      // Arrange
      mockFindByUserReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.resolveProfessionalIdByUserRef('user-ref-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('canViewExactLocation / assertCanViewExactLocation', () => {
    beforeEach(() => {
      mockUserHasPermission.mockResolvedValue(false);
      mockFindByUserReferenceId.mockResolvedValue(null);
      mockHasActiveServiceWith.mockResolvedValue(false);
    });

    it('(i) permite al propio profesional', async () => {
      mockFindByUserReferenceId.mockResolvedValue({ id: 7 });
      await expect(service.canViewExactLocation('u1', 7, [])).resolves.toBe(
        true,
      );
    });

    it('(ii) permite a un admin con permisos ya conocidos (HTTP)', async () => {
      await expect(
        service.canViewExactLocation('u1', 7, ['admin:all']),
      ).resolves.toBe(true);
      expect(mockUserHasPermission).not.toHaveBeenCalled();
    });

    it('(ii) consulta la DB por admin cuando no hay permisos conocidos (WS)', async () => {
      mockUserHasPermission.mockResolvedValue(true);
      await expect(service.canViewExactLocation('u1', 7)).resolves.toBe(true);
    });

    it('(iii) permite a un cliente con servicio activo con ese profesional', async () => {
      mockHasActiveServiceWith.mockResolvedValue(true);
      await expect(service.canViewExactLocation('u1', 7, [])).resolves.toBe(
        true,
      );
      expect(mockHasActiveServiceWith).toHaveBeenCalledWith('u1', 7);
    });

    it('deniega a otro profesional o cliente sin vinculo', async () => {
      mockFindByUserReferenceId.mockResolvedValue({ id: 99 });
      await expect(service.canViewExactLocation('u1', 7, [])).resolves.toBe(
        false,
      );
    });

    it('assert lanza ForbiddenException (403) si no cumple ninguna rama', async () => {
      await expect(
        service.assertCanViewExactLocation('u1', 7, []),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
