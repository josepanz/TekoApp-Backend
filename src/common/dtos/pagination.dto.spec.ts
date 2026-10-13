/**
 * Suite: PaginationQueryDTO (tope de pageSize)
 * Casos: CP-BE-CAT-031, CP-BE-CAT-032 (ver test/qa/casos/CP-CAT.md)
 * Tipo: unitaria   Prioridad: P1
 * Precondiciones: ninguna
 * Trazabilidad: DEF-BE-009
 */
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ListUsersRequestDTO } from '@api/users/dtos/request/list-users.request.dto';
import { MAX_PAGE_SIZE, PaginationQueryDTO } from './pagination.dto';

const errorsFor = (pageSize: unknown) =>
  validateSync(plainToInstance(PaginationQueryDTO, { pageSize })).filter(
    (e) => e.property === 'pageSize',
  );

describe('PaginationQueryDTO.pageSize', () => {
  it('el tope es 100 (máximo que piden hoy los clientes)', () => {
    expect(MAX_PAGE_SIZE).toBe(100);
  });

  it.each(['1', '10', '100'])('acepta %s', (v) => {
    expect(errorsFor(v)).toHaveLength(0);
  });

  it.each(['101', '100000'])('rechaza %s por superar el tope', (v) => {
    const errors = errorsFor(v);
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints ?? {})).toContain('max');
  });

  it.each(['0', '-1'])('sigue rechazando %s por el mínimo', (v) => {
    expect(Object.keys(errorsFor(v)[0].constraints ?? {})).toContain('min');
  });

  it('ListUsersRequestDTO (DTO propio de /users) aplica el mismo tope', () => {
    const bad = validateSync(
      plainToInstance(ListUsersRequestDTO, { pageSize: '100000' }),
    );
    const ok = validateSync(
      plainToInstance(ListUsersRequestDTO, { pageSize: '100' }),
    );
    expect(bad.some((e) => e.property === 'pageSize')).toBe(true);
    expect(ok.some((e) => e.property === 'pageSize')).toBe(false);
  });
});
