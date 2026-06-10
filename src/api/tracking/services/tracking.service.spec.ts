// src/api/tracking/services/tracking.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TrackingApiService } from './tracking.service';
import { TrackingDbService } from '@modules/tracking-db/services/tacking-db.service';

const mockSaveLocationPing = jest.fn();
const mockFindInRadius = jest.fn();
const mockConfigGet = jest.fn();

describe('TrackingApiService', () => {
  let service: TrackingApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingApiService,
        {
          provide: TrackingDbService,
          useValue: {
            saveLocationPing: mockSaveLocationPing,
            findInRadius: mockFindInRadius,
          },
        },
        { provide: ConfigService, useValue: { get: mockConfigGet } },
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
    mockSaveLocationPing.mockResolvedValue(undefined);

    // Act
    const result = await service.processLocationPing(mockDto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe('Ubicación procesada con éxito');
    expect(mockSaveLocationPing).toHaveBeenCalledWith(mockDto);
  });
});
