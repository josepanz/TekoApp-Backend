import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { GeoTrackingLog } from '../schemas/geo-tracking-log.schema';
import { TrackingDbService, GeoTrackingLogLean } from './tacking-db.service';

// ── Mocks a nivel de módulo ────────────────────────────────────────────────
const mockCreate = jest.fn();
const mockFindExec = jest.fn();

// Encadena los métodos fluidos de Mongoose (.find().select().limit().lean().exec())
const mockLean = jest.fn().mockReturnValue({ exec: mockFindExec });
const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
const mockSelect = jest.fn().mockReturnValue({ limit: mockLimit });
const mockFindChain = { select: mockSelect };

const MockGeoTrackingModel = {
  create: mockCreate,
  find: jest.fn().mockReturnValue(mockFindChain),
};

// ── Fixtures ───────────────────────────────────────────────────────────────
const basePing = {
  professionalId: 42,
  serviceId: 'serv-uuid-001',
  latitude: -25.2867,
  longitude: -57.647,
};

const baseLogLean: GeoTrackingLogLean = {
  professionalId: 42,
  serviceId: 'serv-uuid-001',
  location: { type: 'Point', coordinates: [-57.647, -25.2867] },
  heading: 90,
  speed: 30,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
};

describe('TrackingDbService', () => {
  let service: TrackingDbService;

  beforeEach(async () => {
    // Silenciar logs del Logger de NestJS en tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    // Restablecer la cadena fluida en cada test
    MockGeoTrackingModel.find.mockReturnValue(mockFindChain);
    mockSelect.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ lean: mockLean });
    mockLean.mockReturnValue({ exec: mockFindExec });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingDbService,
        {
          provide: getModelToken(GeoTrackingLog.name),
          useValue: MockGeoTrackingModel,
        },
      ],
    }).compile();

    service = module.get<TrackingDbService>(TrackingDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── saveLocationPing ───────────────────────────────────────────────────
  describe('saveLocationPing', () => {
    it('debe persistir el ping de geolocalización con las coordenadas en formato GeoJSON', async () => {
      // Arrange
      mockCreate.mockResolvedValue({});

      // Act
      await service.saveLocationPing(basePing);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        professionalId: basePing.professionalId,
        serviceId: basePing.serviceId,
        heading: undefined,
        speed: undefined,
        location: {
          type: 'Point',
          coordinates: [basePing.longitude, basePing.latitude],
        },
      });
    });

    it('debe persistir el ping incluyendo heading y speed cuando se proveen', async () => {
      // Arrange
      mockCreate.mockResolvedValue({});
      const pingConExtras = { ...basePing, heading: 180, speed: 60 };

      // Act
      await service.saveLocationPing(pingConExtras);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ heading: 180, speed: 60 }),
      );
    });

    it('debe relanzar el error cuando falla la persistencia en MongoDB', async () => {
      // Arrange
      const dbError = new Error('MongoDB connection error');
      mockCreate.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.saveLocationPing(basePing)).rejects.toThrow(dbError);
    });
  });

  // ── findInRadius ───────────────────────────────────────────────────────
  describe('findInRadius', () => {
    it('debe retornar los logs geoespaciales dentro del radio indicado', async () => {
      // Arrange
      const logs: GeoTrackingLogLean[] = [baseLogLean];
      mockFindExec.mockResolvedValue(logs);

      // Act
      const result = await service.findInRadius(-25.2867, -57.647, 500);

      // Assert
      expect(result).toEqual(logs);
      expect(MockGeoTrackingModel.find).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [-57.647, -25.2867],
            },
            $maxDistance: 500,
          },
        },
      });
    });

    it('debe aplicar select de campos específicos y límite de 50 resultados', async () => {
      // Arrange
      mockFindExec.mockResolvedValue([]);

      // Act
      await service.findInRadius(-25.2867, -57.647, 1000);

      // Assert
      expect(mockSelect).toHaveBeenCalledWith(
        'professionalId location createdAt heading speed',
      );
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('debe retornar lista vacía cuando no hay profesionales en el radio', async () => {
      // Arrange
      mockFindExec.mockResolvedValue([]);

      // Act
      const result = await service.findInRadius(0, 0, 100);

      // Assert
      expect(result).toEqual([]);
    });

    it('debe relanzar el error cuando falla la query geoespacial', async () => {
      // Arrange
      const geoError = new Error('2dsphere index error');
      mockFindExec.mockRejectedValue(geoError);

      // Act & Assert
      await expect(
        service.findInRadius(-25.2867, -57.647, 500),
      ).rejects.toThrow(geoError);
    });
  });
});
