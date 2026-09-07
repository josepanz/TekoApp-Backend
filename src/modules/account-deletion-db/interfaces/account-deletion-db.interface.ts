// TS-only (no enum de Prisma): son categorías de bloqueante para el borrado de cuenta, no un
// estado persistido — ver openspec/changes/platform-hardening-2026-09/I-01-account-deletion.md.
export enum DeletionBlockerType {
  ACTIVE_SERVICE = 'ACTIVE_SERVICE',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  UNSIGNED_CONTRACT = 'UNSIGNED_CONTRACT',
}

export interface DeletionBlocker {
  type: DeletionBlockerType;
  count: number;
}
