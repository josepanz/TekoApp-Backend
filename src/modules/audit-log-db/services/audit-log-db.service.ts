import { Injectable } from '@nestjs/common';
import { AuditLogs, Prisma } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';

export interface AuditLogFilters {
  tableName?: string;
  recordId?: string;
  changedBy?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class AuditLogDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  // Paginación manual, no PrismaPaginationUtil: ese helper filtra rango de fechas siempre
  // contra `createdAt` (hardcodeado), y `AuditLogs` no tiene esa columna — solo `changedAt`.
  // Reusarlo rompería en runtime ("Unknown argument createdAt") apenas alguien mandara
  // startDate/endDate.
  async findPaginated(
    filters: AuditLogFilters,
  ): Promise<{ data: AuditLogs[]; pagination: PaginationResponseDTO }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogsWhereInput = {
      ...(filters.tableName ? { tableName: filters.tableName } : {}),
      ...(filters.recordId ? { recordId: filters.recordId } : {}),
      ...(filters.changedBy ? { changedBy: filters.changedBy } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            changedAt: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.extended.auditLogs.findMany({
        where,
        orderBy: { changedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.extended.auditLogs.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
