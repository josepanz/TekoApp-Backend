import { ProfessionalStatus } from '@prisma/client';
import {
  mapStatusHistory,
  resolveStatusAction,
} from './professional-status-history.helper';

const row = (over: Record<string, unknown>) =>
  ({
    id: BigInt(10),
    tableName: 'professionals',
    recordId: '1',
    operationType: 'UPDATE',
    oldData: { status: 'APPROVED', changed_reason: null },
    newData: { status: 'SUSPENDED', changed_reason: 'Reportes' },
    changedAt: new Date('2026-10-13T10:00:00.000Z'),
    changedBy: 'ref-admin',
    reason: 'Reportes',
    ipAddress: '10.0.0.1',
    userAgent: 'jest',
    ...over,
  }) as never;

const admin = {
  id: 3,
  referenceId: 'ref-admin',
  email: 'admin@tekoapp.com.py',
  firstName: 'Ada',
  lastName: 'Admin',
};

describe('professional-status-history.helper', () => {
  describe('resolveStatusAction', () => {
    it.each([
      ['PENDING', 'APPROVED', 'VERIFY'],
      ['REJECTED', 'APPROVED', 'VERIFY'],
      ['PENDING', 'REJECTED', 'REJECT'],
      ['APPROVED', 'SUSPENDED', 'SUSPEND'],
      ['SUSPENDED', 'APPROVED', 'REACTIVATE'],
      ['APPROVED', 'PENDING', 'STATUS_CHANGE'],
    ])('%s -> %s es %s', (from, to, action) => {
      expect(
        resolveStatusAction(
          from as ProfessionalStatus,
          to as ProfessionalStatus,
        ),
      ).toBe(action);
    });
  });

  describe('mapStatusHistory', () => {
    it('debe mapear actor (nombre y email), de->a, motivo, fecha, IP y user-agent', () => {
      const [item] = mapStatusHistory([row({})], [admin]);

      expect(item).toEqual({
        id: '10',
        action: 'SUSPEND',
        fromStatus: 'APPROVED',
        toStatus: 'SUSPENDED',
        reason: 'Reportes',
        changedAt: new Date('2026-10-13T10:00:00.000Z'),
        actor: {
          referenceId: 'ref-admin',
          name: 'Ada Admin',
          email: 'admin@tekoapp.com.py',
        },
        ipAddress: '10.0.0.1',
        userAgent: 'jest',
      });
    });

    it('debe resolver el actor de filas viejas que guardaron el id numérico', () => {
      const [item] = mapStatusHistory([row({ changedBy: '3' })], [admin]);
      expect(item.actor.email).toBe('admin@tekoapp.com.py');
    });

    it('debe dejar el actor en null si el usuario ya no existe', () => {
      const [item] = mapStatusHistory([row({ changedBy: 'ref-borrado' })], []);
      expect(item.actor).toEqual({
        referenceId: null,
        name: null,
        email: null,
      });
    });

    it('debe tomar el motivo de new_data y no de la columna reason (que hereda el anterior por COALESCE)', () => {
      const [item] = mapStatusHistory(
        [
          row({
            oldData: { status: 'SUSPENDED', changed_reason: 'Reportes' },
            newData: { status: 'APPROVED', changed_reason: null },
            reason: 'Reportes',
          }),
        ],
        [admin],
      );
      expect(item.action).toBe('REACTIVATE');
      expect(item.reason).toBeNull();
    });
  });
});
