import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { AuditLogDbService } from './audit-log-db.service';

const mockFindMany = jest.fn();
const mockCount = jest.fn();

const mockPrisma = {
  extended: {
    auditLogs: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
};

describe('AuditLogDbService', () => {
  let service: AuditLogDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditLogDbService>(AuditLogDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findPaginated', () => {
    it('debe paginar con los valores por defecto cuando no se pasa page/pageSize', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      // Act
      const result = await service.findPaginated({});

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { changedAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result.pagination).toEqual({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });
    });

    it('debe combinar los filtros exactos (tableName, recordId, changedBy)', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      // Act
      await service.findPaginated({
        tableName: 'payments',
        recordId: '10',
        changedBy: 'user-1',
      });

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tableName: 'payments',
            recordId: '10',
            changedBy: 'user-1',
          },
        }),
      );
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          tableName: 'payments',
          recordId: '10',
          changedBy: 'user-1',
        },
      });
    });

    it('debe armar el rango de fechas sobre changedAt con startDate y endDate', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);
      const startDate = new Date('2026-09-01T00:00:00.000Z');
      const endDate = new Date('2026-09-07T23:59:59.999Z');

      // Act
      await service.findPaginated({ startDate, endDate });

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { changedAt: { gte: startDate, lte: endDate } },
        }),
      );
    });

    it('debe calcular skip y totalPages para una página distinta de la primera', async () => {
      // Arrange
      const rows = [{ id: BigInt(1) }];
      mockFindMany.mockResolvedValue(rows);
      mockCount.mockResolvedValue(25);

      // Act
      const result = await service.findPaginated({ page: 3, pageSize: 10 });

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.data).toBe(rows);
      expect(result.pagination).toEqual({
        total: 25,
        page: 3,
        pageSize: 10,
        totalPages: 3,
      });
    });
  });
});
