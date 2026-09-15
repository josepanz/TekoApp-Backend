import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogDbService } from '@modules/audit-log-db/services/audit-log-db.service';
import { AuditLogService } from './audit-log.service';
import { GetAuditLogsQueryDTO } from '../dtos/request';

const mockFindPaginated = jest.fn();

function buildAuditLog(overrides: Record<string, unknown> = {}) {
  return {
    id: BigInt(1),
    tableName: 'payments',
    recordId: '10',
    operationType: 'UPDATE',
    oldData: { status: 'PENDING' },
    newData: { status: 'COMPLETED' },
    changedAt: new Date('2026-09-01T00:00:00.000Z'),
    changedBy: 'user-1',
    reason: null,
    ...overrides,
  };
}

describe('AuditLogService', () => {
  let service: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: AuditLogDbService,
          useValue: { findPaginated: mockFindPaginated },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('debe pasar los filtros del query tal cual al db service', async () => {
      // Arrange
      mockFindPaginated.mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      });
      const query: GetAuditLogsQueryDTO = {
        tableName: 'payments',
        recordId: '10',
        changedBy: 'user-1',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-07'),
        page: 2,
        pageSize: 20,
      } as GetAuditLogsQueryDTO;

      // Act
      await service.list(query);

      // Assert
      expect(mockFindPaginated).toHaveBeenCalledWith({
        tableName: 'payments',
        recordId: '10',
        changedBy: 'user-1',
        startDate: query.startDate,
        endDate: query.endDate,
        page: 2,
        pageSize: 20,
      });
    });

    it('debe mapear el id BigInt a string y devolver la paginación tal cual', async () => {
      // Arrange
      const log = buildAuditLog();
      const pagination = { total: 1, page: 1, pageSize: 10, totalPages: 1 };
      mockFindPaginated.mockResolvedValue({ data: [log], pagination });

      // Act
      const result = await service.list({} as GetAuditLogsQueryDTO);

      // Assert
      expect(result.data).toEqual([
        {
          id: '1',
          tableName: 'payments',
          recordId: '10',
          operationType: 'UPDATE',
          oldData: { status: 'PENDING' },
          newData: { status: 'COMPLETED' },
          changedAt: log.changedAt,
          changedBy: 'user-1',
          reason: null,
        },
      ]);
      expect(result.pagination).toBe(pagination);
    });
  });
});
