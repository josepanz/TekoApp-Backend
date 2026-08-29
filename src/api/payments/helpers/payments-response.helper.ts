import { Tips } from '@prisma/client';
import { mapTipToResponse } from '@api/tips/helpers/tips-response.helper';
import {
  PaymentDetailResponseDTO,
  PaymentMethodDetailResponseDTO,
} from '../dtos/response';

/**
 * Mapea un pago crudo de Prisma a su DTO: `id`/`referenceId` del pago se exponen ambos tal cual.
 * `serviceId` sigue siendo el referenceId (UUID) del servicio pagado — nunca la PK interna — esto
 * es independiente del id/referenceId del propio pago. `tip` (si el include lo trajo) se mapea a
 * su propio DTO — nunca se expone la fila cruda de `Tips` (PK interna, `userId`/`professionalId`
 * redundantes con el propio pago).
 */
export function mapPaymentToResponse(payment: {
  id: number;
  referenceId: string;
  serviceId: number;
  service?: { referenceId: string } | null;
  tip?: Tips | null;
  [key: string]: unknown;
}): PaymentDetailResponseDTO {
  const rest: Record<string, unknown> = { ...payment };
  delete rest.service;
  rest.serviceId = payment.service?.referenceId ?? '';
  rest.tip = payment.tip ? mapTipToResponse(payment.tip) : null;
  return rest as unknown as PaymentDetailResponseDTO;
}

export function mapPaymentsToResponse(
  payments: {
    id: number;
    referenceId: string;
    serviceId: number;
    service?: { referenceId: string } | null;
    tip?: Tips | null;
    [key: string]: unknown;
  }[],
): PaymentDetailResponseDTO[] {
  return payments.map((p) => mapPaymentToResponse(p));
}

/** Mapea un método de pago crudo a su DTO: `id`/`referenceId` se exponen ambos tal cual. */
export function mapPaymentMethodToResponse(method: {
  id: number;
  referenceId: string;
  [key: string]: unknown;
}): PaymentMethodDetailResponseDTO {
  return method as unknown as PaymentMethodDetailResponseDTO;
}
