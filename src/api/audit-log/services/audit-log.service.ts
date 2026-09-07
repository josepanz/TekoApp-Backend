import { Injectable } from '@nestjs/common';
import { AuditLogDbService } from '@modules/audit-log-db/services/audit-log-db.service';
import { GetAuditLogsQueryDTO } from '../dtos/request';
import { AuditLogsListResponseDTO } from '../dtos/response';
import { mapAuditLogsToResponse } from '../helpers/audit-log-response.helper';

@Injectable()
export class AuditLogService {
  constructor(private readonly dbService: AuditLogDbService) {}

  async list(query: GetAuditLogsQueryDTO): Promise<AuditLogsListResponseDTO> {
    const { data, pagination } = await this.dbService.findPaginated({
      tableName: query.tableName,
      recordId: query.recordId,
      changedBy: query.changedBy,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      pageSize: query.pageSize,
    });
    return { data: mapAuditLogsToResponse(data), pagination };
  }
}
