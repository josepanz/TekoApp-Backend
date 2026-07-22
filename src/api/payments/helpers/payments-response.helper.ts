import { exposeReferenceAsId } from '@common/helpers/reference-id.helper';
import {
  PaymentDetailResponseDTO,
  PaymentMethodDetailResponseDTO,
} from '../dtos/response';

/**
 * Mapea un pago crudo de Prisma a su DTO: `id` pasa a ser el referenceId (UUID) del pago y
 * `serviceId` pasa a ser el referenceId (UUID) del servicio pagado. Nunca se filtra la PK interna.
 */
export function mapPaymentToResponse(payment: {
  id: number;
  referenceId: string;
  serviceId: number;
  service?: { referenceId: string } | null;
  [key: string]: unknown;
}): PaymentDetailResponseDTO {
  const rest: Record<string, unknown> = { ...payment };
  delete rest.referenceId;
  delete rest.service;
  rest.id = payment.referenceId;
  rest.serviceId = payment.service?.referenceId ?? '';
  return rest as unknown as PaymentDetailResponseDTO;
}

export function mapPaymentsToResponse(
  payments: {
    id: number;
    referenceId: string;
    serviceId: number;
    service?: { referenceId: string } | null;
    [key: string]: unknown;
  }[],
): PaymentDetailResponseDTO[] {
  return payments.map((p) => mapPaymentToResponse(p));
}

/** Mapea un método de pago crudo a su DTO exponiendo el referenceId (UUID) bajo la clave `id`. */
export function mapPaymentMethodToResponse(method: {
  id: number;
  referenceId: string;
  [key: string]: unknown;
}): PaymentMethodDetailResponseDTO {
  return exposeReferenceAsId(
    method,
  ) as unknown as PaymentMethodDetailResponseDTO;
}
