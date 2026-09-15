import {
  ServiceDetailResponseDTO,
  ServiceRequestDetailResponseDTO,
} from '../dtos/response';

interface RawUserContact {
  email?: string;
  phoneNumber?: string | null;
  shareContactInfo?: boolean;
  [key: string]: unknown;
}

/**
 * Tarea 8 (platform-hardening-2026-09, 2026-09-14): `email`/`phoneNumber` NO se exponen en
 * `ServiceUserSummaryResponseDTO` cuando el dueño de la cuenta desactivó `shareContactInfo` —
 * no alcanza con que el frontend los oculte, si viajan en la respuesta están expuestos igual.
 * Se aplica parejo a `service.users` (cliente) y `service.professional.user` (profesional): el
 * campo vive en `Users` sin distinción de rol, y ambos comparten el mismo
 * `ServiceUserSummaryResponseDTO`.
 *
 * Elimina las claves (no las deja en `null`) para que "no expuesto" sea literal en el JSON, no
 * un valor visible que confirma que el dato existe.
 */
function maskContactIfNotShared<T extends RawUserContact | null | undefined>(
  user: T,
): T {
  if (!user || user.shareContactInfo !== false) return user;
  const rest: Record<string, unknown> = { ...user };
  delete rest.email;
  delete rest.phoneNumber;
  return rest as T;
}

/**
 * Mapea un servicio crudo de Prisma a su DTO de respuesta: `id` (Int) y `referenceId` (UUID) se
 * exponen ambos tal cual — `id` es solo para ordenamiento, `referenceId` es la clave pública real.
 * Las relaciones anidadas (users/professional/category) conservan su forma actual (esos modelos
 * ya exponen id numérico + referenceId), salvo el contacto del dueño de cada cuenta (tarea 8).
 */
export function mapServiceToResponse(service: {
  id: number;
  referenceId: string;
  users?: RawUserContact;
  professional?: { user?: RawUserContact; [key: string]: unknown } | null;
  [key: string]: unknown;
}): ServiceDetailResponseDTO {
  const mapped: Record<string, unknown> = { ...service };
  if (service.users) {
    mapped.users = maskContactIfNotShared(service.users);
  }
  if (service.professional) {
    mapped.professional = {
      ...service.professional,
      user: maskContactIfNotShared(service.professional.user),
    };
  }
  return mapped as unknown as ServiceDetailResponseDTO;
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
