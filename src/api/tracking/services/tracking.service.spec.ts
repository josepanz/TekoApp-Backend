// src/api/tracking/services/tracking.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TrackingApiService } from './tracking.service';
import { TrackingDbService } from '@modules/tracking-db/services/tacking-db.service';

describe('TrackingApiService', () => {
  let service: TrackingApiService;
  let trackingDbServiceMock: jest.Mocked<TrackingDbService>;
  let configServiceMock: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    trackingDbServiceMock = {
      saveLocationPing: jest.fn(),
      findInRadius: jest.fn(),
    } as unknown as jest.Mocked<TrackingDbService>;

    configServiceMock = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingApiService,
        { provide: TrackingDbService, useValue: trackingDbServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<TrackingApiService>(TrackingApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe procesar y retornar una instancia estructural exitosa al registrar un ping de ubicacion', async () => {
    // Arrange
    const mockDto = {
      professionalId: 44,
      serviceId: 'bc833a69-63a9-4670-80d4-7be85f7d29bc',
      latitude: -25.321,
      longitude: -57.552,
    };
    trackingDbServiceMock.saveLocationPing.mockResolvedValue(undefined);

    // Act
    const result = await service.processLocationPing(mockDto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe('Ubicación procesada con éxito');
    expect(trackingDbServiceMock.saveLocationPing).toHaveBeenCalledWith(
      mockDto,
    );
  });
});
