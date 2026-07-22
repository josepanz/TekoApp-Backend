import { exposeReferenceAsId } from '@common/helpers/reference-id.helper';
import {
  ServiceDetailResponseDTO,
  ServiceRequestDetailResponseDTO,
} from '../dtos/response';

/**
 * Mapea un servicio crudo de Prisma a su DTO de respuesta: expone el `referenceId` (UUID) bajo la
 * clave `id` y no filtra la PK interna (Int). Las relaciones anidadas (users/professional/category)
 * conservan su forma actual (esos modelos ya exponen id numérico + referenceId).
 */
export function mapServiceToResponse(service: {
  id: number;
  referenceId: string;
  [key: string]: unknown;
}): ServiceDetailResponseDTO {
  return exposeReferenceAsId(service) as unknown as ServiceDetailResponseDTO;
}

export function mapServicesToResponse(
  services: {
    id: number;
    referenceId: string;
    [key: string]: unknown;
  }[],
): ServiceDetailResponseDTO[] {
  return services.map((s) => mapServiceToResponse(s));
}

/**
 * Mapea una solicitud de servicio cruda a su DTO. `id` pasa a ser el referenceId de la solicitud y
 * `serviceId` pasa a ser el referenceId (UUID) del servicio padre — nunca la PK interna.
 */
export function mapServiceRequestToResponse(request: {
  id: number;
  referenceId: string;
  serviceId: number;
  service?: { referenceId: string } | null;
  [key: string]: unknown;
}): ServiceRequestDetailResponseDTO {
  const rest: Record<string, unknown> = { ...request };
  delete rest.referenceId;
  delete rest.service;
  rest.id = request.referenceId;
  rest.serviceId = request.service?.referenceId ?? '';
  return rest as unknown as ServiceRequestDetailResponseDTO;
}

export function mapServiceRequestsToResponse(
  requests: {
    id: number;
    referenceId: string;
    serviceId: number;
    service?: { referenceId: string } | null;
    [key: string]: unknown;
  }[],
): ServiceRequestDetailResponseDTO[] {
  return requests.map((r) => mapServiceRequestToResponse(r));
}
