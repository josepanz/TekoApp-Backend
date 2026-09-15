import { AuditLogs } from '@prisma/client';
import { AuditLogResponseDTO } from '../dtos/response';

export function mapAuditLogToResponse(log: AuditLogs): AuditLogResponseDTO {
  return {
    id: log.id.toString(),
    tableName: log.tableName,
    recordId: log.recordId,
    operationType: log.operationType,
    oldData: log.oldData,
    newData: log.newData,
    changedAt: log.changedAt,
    changedBy: log.changedBy,
    reason: log.reason,
  };
}

export function mapAuditLogsToResponse(
  logs: AuditLogs[],
): AuditLogResponseDTO[] {
  return logs.map(mapAuditLogToResponse);
}
