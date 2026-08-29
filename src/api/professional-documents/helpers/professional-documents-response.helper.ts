import { ProfessionalDocumentTypes } from '@prisma/client';
import {
  ProfessionalDocumentForAdminQueue,
  ProfessionalDocumentWithType,
} from '@modules/professional-documents-db/services/professional-documents-db.service';
import {
  AdminProfessionalDocumentResponseDTO,
  MyDocumentStatusResponseDTO,
  ProfessionalDocumentResponseDTO,
} from '../dtos/response';
import { ProfessionalDocumentTypeResponseDTO } from '@/api/professional-document-types/dtos/response';

/**
 * Mapeo explícito (no cast crudo) — a diferencia de `ai-disclosures`, acá el modelo Prisma trae
 * campos internos sensibles (`id`, `professionalId`, `createdBy`, `checksum`, etc.) que
 * `ClassSerializerInterceptor` NO filtra automáticamente sobre un objeto plano (solo transforma
 * instancias de clase con decorators de class-transformer) — construir la respuesta a mano evita
 * filtrar esos campos.
 */
export function mapDocumentTypeToResponse(
  type: ProfessionalDocumentTypes,
): ProfessionalDocumentTypeResponseDTO {
  return {
    referenceId: type.referenceId,
    code: type.code,
    name: type.name,
    description: type.description,
    category: type.category,
    countryId: type.countryId,
    professionalCategoryId: type.professionalCategoryId,
    isRequired: type.isRequired,
    validityDays: type.validityDays,
    requiresStaffReview: type.requiresStaffReview,
    isVisibleToClient: type.isVisibleToClient,
    sortOrder: type.sortOrder,
    isActive: type.isActive,
  };
}

export function mapDocumentToResponse(
  document: ProfessionalDocumentWithType,
): ProfessionalDocumentResponseDTO {
  return {
    referenceId: document.referenceId,
    professionalDocumentType: mapDocumentTypeToResponse(
      document.professionalDocumentType,
    ),
    fileKey: document.fileKey,
    status: document.status,
    issuedAt: document.issuedAt,
    expiresAt: document.expiresAt,
    reviewedAt: document.reviewedAt,
    rejectionReason: document.rejectionReason,
    createdAt: document.createdAt,
  };
}

export function mapDocumentsToResponse(
  documents: ProfessionalDocumentWithType[],
): ProfessionalDocumentResponseDTO[] {
  return documents.map(mapDocumentToResponse);
}

export function mapAdminQueueDocumentToResponse(
  document: ProfessionalDocumentForAdminQueue,
): AdminProfessionalDocumentResponseDTO {
  return {
    ...mapDocumentToResponse(document),
    professional: {
      referenceId: document.professional.referenceId,
      firstName: document.professional.user.firstName,
      lastName: document.professional.user.lastName,
    },
  };
}

export function mapAdminQueueDocumentsToResponse(
  documents: ProfessionalDocumentForAdminQueue[],
): AdminProfessionalDocumentResponseDTO[] {
  return documents.map(mapAdminQueueDocumentToResponse);
}

export function mapMyDocumentStatus(
  type: ProfessionalDocumentTypes,
  document: ProfessionalDocumentWithType | undefined,
): MyDocumentStatusResponseDTO {
  return {
    documentType: mapDocumentTypeToResponse(type),
    document: document ? mapDocumentToResponse(document) : null,
  };
}
