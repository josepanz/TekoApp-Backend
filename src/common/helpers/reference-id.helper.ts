/**
 * Helper para dominios que usan el patrón `id` interno (Int, nunca expuesto) + `referenceId`
 * (UUID público). Toma una entidad cruda de Prisma y devuelve una copia donde el `id` externo pasa
 * a ser el valor de `referenceId`, eliminando el `id` numérico interno y la clave `referenceId`.
 *
 * Se usa en Services / ServiceRequests / Payments / PaymentMethodEntity / PaymentTransaction /
 * Rating, cuyo contrato público expone el UUID bajo la clave `id` (sin filtrar la PK interna).
 */
export function exposeReferenceAsId<
  T extends { id: number; referenceId: string },
>(entity: T): Omit<T, 'id' | 'referenceId'> & { id: string } {
  const rest: Record<string, unknown> = { ...entity };
  delete rest.referenceId;
  rest.id = entity.referenceId;
  return rest as Omit<T, 'id' | 'referenceId'> & { id: string };
}
