import { AuditLogs, ProfessionalStatus } from '@prisma/client';
import { ProfessionalStatusActor } from '@modules/professionals-db/services/professionals-db.service';
import {
  ProfessionalStatusHistoryItemDTO,
  StatusHistoryAction,
} from '../dtos/response/professional-status-history.response.dto';

/** Acción de negocio que explica un cambio de estado (el audit-log solo guarda UPDATE con old/new). */
export function resolveStatusAction(
  from: ProfessionalStatus,
  to: ProfessionalStatus,
): StatusHistoryAction {
  if (to === ProfessionalStatus.APPROVED) {
    return from === ProfessionalStatus.SUSPENDED ? 'REACTIVATE' : 'VERIFY';
  }
  if (to === ProfessionalStatus.REJECTED) return 'REJECT';
  if (to === ProfessionalStatus.SUSPENDED) return 'SUSPEND';
  return 'STATUS_CHANGE';
}

const jsonField = (data: unknown, key: string): unknown =>
  data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)[key]
    : undefined;

/**
 * `reason` sale de `new_data.changed_reason` y no de la columna `audit_logs.reason`: el trigger hace
 * `COALESCE(NEW.changed_reason, OLD.changed_reason)`, así que un verify sin nota heredaría el motivo
 * anterior en la columna, mientras que `new_data` refleja lo que realmente quedó en la fila.
 */
export function mapStatusHistory(
  rows: AuditLogs[],
  actors: ProfessionalStatusActor[],
): ProfessionalStatusHistoryItemDTO[] {
  const byRef = new Map(actors.map((a) => [a.referenceId, a]));
  const byId = new Map(actors.map((a) => [String(a.id), a]));
  return rows.map((row) => {
    const from = jsonField(row.oldData, 'status') as ProfessionalStatus;
    const to = jsonField(row.newData, 'status') as ProfessionalStatus;
    const reason = jsonField(row.newData, 'changed_reason');
    const user = byRef.get(row.changedBy) ?? byId.get(row.changedBy);
    return {
      id: row.id.toString(),
      action: resolveStatusAction(from, to),
      fromStatus: from,
      toStatus: to,
      reason: typeof reason === 'string' && reason !== '' ? reason : null,
      changedAt: row.changedAt,
      actor: {
        referenceId: user?.referenceId ?? null,
        name: user ? `${user.firstName} ${user.lastName}`.trim() : null,
        email: user?.email ?? null,
      },
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
    };
  });
}
