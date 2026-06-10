import { Test, TestingModule } from '@nestjs/testing';
import { TrackingController } from './tracking.controller';
import { TrackingApiService } from '@api/tracking/services/tracking.service';
import { UpdateLocationRequestDTO } from '@api/tracking/dtos/request/update-location.request.dto';
import { GetNearbyProfessionalsRequestDTO } from '@api/tracking/dtos/request/get-nearby-professionals.request.dto';
import { UpdateLocationResponseDTO } from '@api/tracking/dtos/response/update-location.response.dto';
import { GetNearbyProfessionalsResponseDTO } from '@api/tracking/dtos/response/get-nearby-professionals.response.dto';

// ── mocks de nivel de módulo ─────────────────────────────────────────────────
const mockProcessLocationPing = jest.fn();
const mockGetNearbyProviders = jest.fn();

describe('TrackingController', () => {
  let controller: TrackingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrackingController],
      providers: [
        {
          provide: TrackingApiService,
          useValue: {
            processLocationPing: mockProcessLocationPing,
            getNearbyProviders: mockGetNearbyProviders,
          },
        },
      ],
    }).compile();

    controller = module.get<TrackingController>(TrackingController);
  });

  afterEach(() => jest.clearAllMocks());

  // ── updateLocation (POST /tracking/ping) ──────────────────────────────────
  describe('updateLocation', () => {
    it('debe procesar el ping de ubicación y confirmar éxito', async () => {
      // Arrange
      const dto: UpdateLocationRequestDTO = {
        professionalId: 125,
        serviceId: 'f3bca852-1243-4c91-949e-b98d1a49f512',
        latitude: -25.2866,
        longitude: -57.6181,
        heading: 180,
        speed: 45.5,
      };

      const expected: UpdateLocationResponseDTO = {
        success: true,
        message: 'Ubicación procesada con éxito',
      };
      mockProcessLocationPing.mockResolvedValue(expected);

      // Act
      const result = await controller.updateLocation(dto);

      // Assert
      expect(result).toEqual(expected);
      expect(mockProcessLocationPing).toHaveBeenCalledWith(dto);
    });

    it('debe procesar el ping sin campos opcionales heading y speed', async () => {
      // Arrange
      const dto: UpdateLocationRequestDTO = {
        professionalId: 10,
        serviceId: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
        latitude: -25.3,
        longitude: -57.6,
      };

      const expected: UpdateLocationResponseDTO = {
        success: true,
        message: 'Ubicación procesada con éxito',
      };
      mockProcessLocationPing.mockResolvedValue(expected);

      // Act
      const result = await controller.updateLocation(dto);

      // Assert
      expect(result.success).toBe(true);
      expect(mockProcessLocationPing).toHaveBeenCalledWith(
        expect.objectContaining({
          professionalId: 10,
          latitude: -25.3,
          longitude: -57.6,
        }),
      );
    });

    it('debe propagar el error cuando el servicio de tracking falla', async () => {
      // Arrange
      const dto: UpdateLocationRequestDTO = {
        professionalId: 1,
        serviceId: 'aaaabbbb-0000-0000-0000-000000000000',
        latitude: 0,
        longitude: 0,
      };
      mockProcessLocationPing.mockRejectedValue(
        new Error('DB connection lost'),
      );

      // Act & Assert
      await expect(controller.updateLocation(dto)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  // ── getNearbyProfessionals (GET /tracking/nearby) ─────────────────────────
  describe('getNearbyProfessionals', () => {
    it('debe retornar la lista de profesionales dentro del radio especificado', async () => {
      // Arrange
      const query: GetNearbyProfessionalsRequestDTO = {
        latitude: -25.2912,
        longitude: -57.6225,
        radiusKm: 5,
      };

      const expected: GetNearbyProfessionalsResponseDTO = {
        success: true,
        meta: { radiusAppliedKm: 5, resultsCount: 3 },
        data: [
          {
            professionalId: 125,
            location: { type: 'Point', coordinates: [-57.62, -25.29] },
            createdAt: new Date('2026-06-07T18:30:00.000Z'),
          },
        ],
      };
      mockGetNearbyProviders.mockResolvedValue(expected);

      // Act
      const result = await controller.getNearbyProfessionals(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetNearbyProviders).toHaveBeenCalledWith(query);
    });

    it('debe retornar lista vacía cuando no hay profesionales en el radio', async () => {
      // Arrange
      const query: GetNearbyProfessionalsRequestDTO = {
        latitude: -25.2912,
        longitude: -57.6225,
      };

      const expected: GetNearbyProfessionalsResponseDTO = {
        success: true,
        meta: { radiusAppliedKm: 10, resultsCount: 0 },
        data: [],
      };
      mockGetNearbyProviders.mockResolvedValue(expected);

      // Act
      const result = await controller.getNearbyProfessionals(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.meta.resultsCount).toBe(0);
    });

    it('debe usar el radio por defecto cuando radiusKm no se proporciona', async () => {
      // Arrange
      const query: GetNearbyProfessionalsRequestDTO = {
        latitude: -25.2912,
        longitude: -57.6225,
      };

      const expected: GetNearbyProfessionalsResponseDTO = {
        success: true,
        meta: { radiusAppliedKm: 10, resultsCount: 1 },
        data: [],
      };
      mockGetNearbyProviders.mockResolvedValue(expected);

      // Act
      const result = await controller.getNearbyProfessionals(query);

      // Assert
      expect(mockGetNearbyProviders).toHaveBeenCalledWith(
        expect.not.objectContaining({ radiusKm: expect.anything() as unknown }),
      );
      expect(result.meta.radiusAppliedKm).toBe(10);
    });
  });
});
