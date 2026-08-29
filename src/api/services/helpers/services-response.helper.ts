import {
  ServiceDetailResponseDTO,
  ServiceRequestDetailResponseDTO,
} from '../dtos/response';

/**
 * Mapea un servicio crudo de Prisma a su DTO de respuesta: `id` (Int) y `referenceId` (UUID) se
 * exponen ambos tal cual — `id` es solo para ordenamiento, `referenceId` es la clave pública real.
 * Las relaciones anidadas (users/professional/category) conservan su forma actual (esos modelos
 * ya exponen id numérico + referenceId).
 */
export function mapServiceToResponse(service: {
  id: number;
  referenceId: string;
  [key: string]: unknown;
}): ServiceDetailResponseDTO {
  return service as unknown as ServiceDetailResponseDTO;
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
 * Mapea una solicitud de servicio cruda a su DTO. `id`/`referenceId` de la solicitud se exponen
 * ambos tal cual. `serviceId` sigue siendo el referenceId (UUID) del servicio padre — nunca la PK
 * interna — esto es independiente del id/referenceId de la propia solicitud.
 */
export function mapServiceRequestToResponse(request: {
  id: number;
  referenceId: string;
  serviceId: number;
  service?: { referenceId: string } | null;
  [key: string]: unknown;
}): ServiceRequestDetailResponseDTO {
  const rest: Record<string, unknown> = { ...request };
  delete rest.service;
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
