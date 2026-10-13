/**
 * Suite: controller de /locations: delegación al servicio, 403 propagado en ubicación exacta y JwtAuthGuard a nivel de clase
 * Casos: CP-BE-LOC-001, CP-BE-LOC-005 (ver test/qa/casos/CP-LOC.md)
 * Tipo: unitaria   Prioridad: P1
 * Precondiciones: servicio y guards mockeados (sin infraestructura)
 * Trazabilidad: blindaje de /locations (commit f9b53da)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { LocationsController } from './locations.controller';
import { LocationsService } from '../services/locations.service';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { UpdateLocationRequestDTO } from '../dtos/request/update-location-request.dto';
import { FindNearbyQueryDTO } from '../dtos/request/find-nearby-query.dto';
import { GetProfessionalLocationParamDTO } from '../dtos/request/get-professional-location-param.dto';
import { GetProfessionalsAreaQueryDTO } from '../dtos/request/get-professionals-area-query.dto';
import { CalculateDistanceQueryDTO } from '../dtos/request/calculate-distance-query.dto';

const mockUpdateLocation = jest.fn();
const mockResolveProfessionalIdByUserRef = jest.fn();
const mockSetOnlineStatus = jest.fn();
const mockFindNearbyProfessionals = jest.fn();
const mockGetProfessionalLocation = jest.fn();
const mockGetOnlineProfessionalsCount = jest.fn();
const mockGetProfessionalsByArea = jest.fn();
const mockCalculateDistance = jest.fn();
const mockAssertCanViewExactLocation = jest.fn();

const mockReq = {
  user: { id: 1, referenceId: 'user-ref-1' } as unknown as IUserDataOnJwt,
};

describe('LocationsController', () => {
  let controller: LocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: {
            updateLocation: mockUpdateLocation,
            resolveProfessionalIdByUserRef: mockResolveProfessionalIdByUserRef,
            setOnlineStatus: mockSetOnlineStatus,
            findNearbyProfessionals: mockFindNearbyProfessionals,
            getProfessionalLocation: mockGetProfessionalLocation,
            getOnlineProfessionalsCount: mockGetOnlineProfessionalsCount,
            getProfessionalsByArea: mockGetProfessionalsByArea,
            calculateDistance: mockCalculateDistance,
            assertCanViewExactLocation: mockAssertCanViewExactLocation,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<LocationsController>(LocationsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('updateLocation', () => {
    it('debe actualizar la ubicación resolviendo el professionalId desde el referenceId del usuario', async () => {
      // Arrange
      const dto = {
        latitude: -25.3,
        longitude: -57.6,
      } as UpdateLocationRequestDTO;
      const expected = { updated: true };
      mockResolveProfessionalIdByUserRef.mockResolvedValue(42);
      mockUpdateLocation.mockResolvedValue(expected);

      // Act
      const result = await controller.updateLocation(mockReq, dto);

      // Assert
      expect(result).toEqual(expected);
      expect(mockResolveProfessionalIdByUserRef).toHaveBeenCalledWith(
        'user-ref-1',
      );
      expect(mockUpdateLocation).toHaveBeenCalledWith(42, dto);
    });
  });

  describe('setOnlineStatus', () => {
    it('debe cambiar el estado online del profesional autenticado', async () => {
      // Arrange
      const expected = { id: 42, isOnline: true };
      mockSetOnlineStatus.mockResolvedValue(expected);

      // Act
      const result = await controller.setOnlineStatus(mockReq, {
        isOnline: true,
      });

      // Assert
      expect(result).toEqual(expected);
      expect(mockSetOnlineStatus).toHaveBeenCalledWith('user-ref-1', true);
    });
  });

  describe('findNearbyProfessionals', () => {
    it('debe retornar profesionales cercanos según los parámetros de búsqueda', async () => {
      // Arrange
      const query = {
        latitude: -25.3,
        longitude: -57.6,
        radius: 5,
      } as unknown as FindNearbyQueryDTO;
      const expected = [{ id: 1, name: 'Juan' }];
      mockFindNearbyProfessionals.mockResolvedValue(expected);

      // Act
      const result = await controller.findNearbyProfessionals(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindNearbyProfessionals).toHaveBeenCalledWith(query);
    });
  });

  describe('getProfessionalLocation', () => {
    it('debe retornar la ubicación activa del profesional por su ID', async () => {
      // Arrange
      const param = { id: 5 } as unknown as GetProfessionalLocationParamDTO;
      const expected = { latitude: -25.3, longitude: -57.6, isOnline: true };
      mockGetProfessionalLocation.mockResolvedValue(expected);

      // Act
      const result = await controller.getProfessionalLocation(mockReq, param);

      // Assert
      expect(result).toEqual(expected);
      expect(mockAssertCanViewExactLocation).toHaveBeenCalledWith(
        'user-ref-1',
        5,
        undefined,
      );
      expect(mockGetProfessionalLocation).toHaveBeenCalledWith(5);
    });

    it('debe propagar el 403 y no leer la coordenada si el requester no esta autorizado', async () => {
      // Arrange
      const param = { id: 5 } as unknown as GetProfessionalLocationParamDTO;
      mockAssertCanViewExactLocation.mockRejectedValue(
        new ForbiddenException('x'),
      );

      // Act + Assert
      await expect(
        controller.getProfessionalLocation(mockReq, param),
      ).rejects.toThrow(ForbiddenException);
      expect(mockGetProfessionalLocation).not.toHaveBeenCalled();
    });
  });

  describe('getOnlineProfessionalsCount', () => {
    it('debe retornar el total de profesionales en línea envuelto en { count }', async () => {
      // Arrange
      mockGetOnlineProfessionalsCount.mockResolvedValue(15);

      // Act
      const result = await controller.getOnlineProfessionalsCount();

      // Assert
      expect(result).toEqual({ count: 15 });
      expect(mockGetOnlineProfessionalsCount).toHaveBeenCalled();
    });
  });

  describe('getProfessionalsByArea', () => {
    it('debe retornar profesionales dentro del área bounding-box indicada', async () => {
      // Arrange
      const query = {
        latMin: -25.5,
        latMax: -25.1,
        lngMin: -57.8,
        lngMax: -57.4,
      } as unknown as GetProfessionalsAreaQueryDTO;
      const expected = [{ id: 2, name: 'Carlos' }];
      mockGetProfessionalsByArea.mockResolvedValue(expected);

      // Act
      const result = await controller.getProfessionalsByArea(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetProfessionalsByArea).toHaveBeenCalledWith(query);
    });
  });

  describe('calculateDistance', () => {
    it('debe retornar la distancia redondeada a 2 decimales en km', () => {
      // Arrange
      const query = {} as CalculateDistanceQueryDTO;
      mockCalculateDistance.mockReturnValue(10.56789);

      // Act
      const result = controller.calculateDistance(query);

      // Assert
      expect(result).toEqual({ distance: 10.57, unit: 'km' });
      expect(mockCalculateDistance).toHaveBeenCalledWith(query);
    });

    it('debe redondear correctamente distancias con más de 2 decimales significativos', () => {
      // Arrange
      mockCalculateDistance.mockReturnValue(3.14159);

      // Act
      const result = controller.calculateDistance(
        {} as CalculateDistanceQueryDTO,
      );

      // Assert
      expect(result.distance).toBe(3.14);
      expect(result.unit).toBe('km');
    });
  });

  describe('seguridad', () => {
    it('JwtAuthGuard esta aplicado a nivel de clase (todos los endpoints exigen JWT)', () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        LocationsController,
      ) as unknown[];
      expect(guards).toContain(JwtAuthGuard);
    });
  });
});
