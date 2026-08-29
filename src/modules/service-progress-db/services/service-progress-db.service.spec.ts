import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { ServiceProgressDbService } from './service-progress-db.service';

const mockFindMany = jest.fn();
const mockCount = jest.fn();
const mockFindFirst = jest.fn();
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();

const mockPrisma = {
  extended: {
    serviceProgressEntries: {
      findMany: mockFindMany,
      count: mockCount,
      findFirst: mockFindFirst,
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
};

describe('ServiceProgressDbService', () => {
  let service: ServiceProgressDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceProgressDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ServiceProgressDbService>(ServiceProgressDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findActiveByServiceId', () => {
    it('debe listar solo entradas activas ordenadas por entryOrder ascendente', async () => {
      // Arrange
      const entries = [{ referenceId: 'entry-1' }];
      mockFindMany.mockResolvedValue(entries);

      // Act
      const result = await service.findActiveByServiceId(10);

      // Assert
      expect(result).toEqual(entries);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { serviceId: 10, isActive: true },
        orderBy: { entryOrder: 'asc' },
      });
    });
  });

  describe('countActiveByServiceId', () => {
    it('debe contar solo entradas activas del servicio', async () => {
      // Arrange
      mockCount.mockResolvedValue(3);

      // Act
      const result = await service.countActiveByServiceId(10);

      // Assert
      expect(result).toBe(3);
      expect(mockCount).toHaveBeenCalledWith({
        where: { serviceId: 10, isActive: true },
      });
    });
  });

  describe('getNextEntryOrder', () => {
    it('debe devolver 1 cuando el servicio todavía no tiene ninguna entrada', async () => {
      // Arrange
      mockFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.getNextEntryOrder(10);

      // Assert
      expect(result).toBe(1);
    });

    it('debe devolver el siguiente número tomando en cuenta también entradas eliminadas', async () => {
      // Arrange
      mockFindFirst.mockResolvedValue({ entryOrder: 5 });

      // Act
      const result = await service.getNextEntryOrder(10);

      // Assert
      expect(result).toBe(6);
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { serviceId: 10 } }),
      );
    });
  });

  describe('softDeleteEntry', () => {
    it('debe marcar isActive en false sin borrar el registro', async () => {
      // Arrange
      mockUpdate.mockResolvedValue({ isActive: false });

      // Act
      await service.softDeleteEntry(7, 'user-ref-1');

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { isActive: false, lastChangedBy: 'user-ref-1' },
      });
    });
  });
});
