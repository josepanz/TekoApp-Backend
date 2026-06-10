import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDatasource } from '@/core/database/services/prisma.service';
import { LocationsDbService } from './locations-db.service';
import { FindNearbyQueryDTO } from '@/api/locations/dtos/request/find-nearby-query.dto';

// ── Mocks a nivel de módulo ────────────────────────────────────────────────
const mockFindUnique = jest.fn();
const mockCount = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockQueryRawUnsafe = jest.fn();

const mockPrisma = {
  extended: {
    professionals: {
      findUnique: mockFindUnique,
      count: mockCount,
      findMany: mockFindMany,
      update: mockUpdate,
    },
    $queryRawUnsafe: mockQueryRawUnsafe,
  },
};

// ── Fixtures ───────────────────────────────────────────────────────────────
const baseProfessional = {
  id: 1,
  name: 'Juan Pérez',
  currentLatitude: -25.2867,
  currentLongitude: -57.647,
  lastLocationUpdate: new Date('2024-01-01T10:00:00Z'),
  isOnline: true,
  isAvailable: true,
};

describe('LocationsDbService', () => {
  let service: LocationsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LocationsDbService>(LocationsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('debe retornar el profesional cuando el id existe', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(baseProfessional);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(baseProfessional);
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('debe retornar null cuando el profesional no existe', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── countOnline ────────────────────────────────────────────────────────
  describe('countOnline', () => {
    it('debe retornar la cantidad de profesionales que cumplen la condición', async () => {
      // Arrange
      mockCount.mockResolvedValue(5);
      const whereClause = { isOnline: true };

      // Act
      const result = await service.countOnline(whereClause);

      // Assert
      expect(result).toBe(5);
      expect(mockCount).toHaveBeenCalledWith({ where: whereClause });
    });

    it('debe retornar 0 cuando no hay profesionales que coincidan', async () => {
      // Arrange
      mockCount.mockResolvedValue(0);

      // Act
      const result = await service.countOnline({ isOnline: false });

      // Assert
      expect(result).toBe(0);
    });
  });

  // ── findMany ───────────────────────────────────────────────────────────
  describe('findMany', () => {
    it('debe retornar la lista de profesionales con los args aplicados', async () => {
      // Arrange
      const professionals = [baseProfessional];
      mockFindMany.mockResolvedValue(professionals);
      const args = { where: { isOnline: true }, take: 10 };

      // Act
      const result = await service.findMany(args);

      // Assert
      expect(result).toEqual(professionals);
      expect(mockFindMany).toHaveBeenCalledWith(args);
    });

    it('debe retornar lista vacía cuando no hay resultados', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      const result = await service.findMany({ where: { isOnline: false } });

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── updateLocation ─────────────────────────────────────────────────────
  describe('updateLocation', () => {
    it('debe actualizar latitud, longitud y timestamp del profesional', async () => {
      // Arrange
      const lat = -25.2867;
      const lng = -57.647;
      const updated = {
        ...baseProfessional,
        currentLatitude: lat,
        currentLongitude: lng,
      };
      mockUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updateLocation(1, lat, lng);

      // Assert
      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            currentLatitude: lat,
            currentLongitude: lng,
          }) as object,
        }),
      );
    });
  });

  // ── findNearby ─────────────────────────────────────────────────────────
  describe('findNearby', () => {
    it('debe ejecutar la query raw y retornar los profesionales cercanos con distancia', async () => {
      // Arrange
      const nearby = [{ ...baseProfessional, distance: 1.2 }];
      mockQueryRawUnsafe.mockResolvedValue(nearby);

      const dto: FindNearbyQueryDTO = {
        latitude: -25.2867,
        longitude: -57.647,
        radius: 5,
        limit: 10,
        availableOnly: false,
        onlineOnly: false,
      };

      // Act
      const result = await service.findNearby(dto);

      // Assert
      expect(result).toEqual(nearby);
      expect(mockQueryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT *'),
        dto.latitude,
        dto.longitude,
        dto.radius,
        dto.limit,
      );
    });

    it('debe incluir filtro de categoryId en la query cuando se provee', async () => {
      // Arrange
      mockQueryRawUnsafe.mockResolvedValue([]);

      const dto: FindNearbyQueryDTO = {
        latitude: -25.2867,
        longitude: -57.647,
        radius: 5,
        limit: 10,
        categoryId: 'abc-123',
        availableOnly: false,
        onlineOnly: false,
      };

      // Act
      await service.findNearby(dto);

      // Assert
      const calledSql: string = (
        mockQueryRawUnsafe.mock.calls[0] as unknown[]
      )[0] as string;
      expect(calledSql).toContain('category_id');
    });

    it('debe incluir filtro de disponibilidad cuando availableOnly es true', async () => {
      // Arrange
      mockQueryRawUnsafe.mockResolvedValue([]);

      const dto: FindNearbyQueryDTO = {
        latitude: -25.2867,
        longitude: -57.647,
        radius: 5,
        limit: 10,
        availableOnly: true,
        onlineOnly: false,
      };

      // Act
      await service.findNearby(dto);

      // Assert
      const calledSql: string = (
        mockQueryRawUnsafe.mock.calls[0] as unknown[]
      )[0] as string;
      expect(calledSql).toContain('is_available = true');
    });

    it('debe incluir filtro de online cuando onlineOnly es true', async () => {
      // Arrange
      mockQueryRawUnsafe.mockResolvedValue([]);

      const dto: FindNearbyQueryDTO = {
        latitude: -25.2867,
        longitude: -57.647,
        radius: 5,
        limit: 10,
        availableOnly: false,
        onlineOnly: true,
      };

      // Act
      await service.findNearby(dto);

      // Assert
      const calledSql: string = (
        mockQueryRawUnsafe.mock.calls[0] as unknown[]
      )[0] as string;
      expect(calledSql).toContain('is_online = true');
    });

    it('debe retornar lista vacía cuando no hay profesionales en el radio', async () => {
      // Arrange
      mockQueryRawUnsafe.mockResolvedValue([]);

      const dto: FindNearbyQueryDTO = {
        latitude: 0,
        longitude: 0,
        radius: 1,
        limit: 10,
        availableOnly: false,
        onlineOnly: false,
      };

      // Act
      const result = await service.findNearby(dto);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
