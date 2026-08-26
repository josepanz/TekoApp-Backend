import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  DataConsentsHistoryResponseDTO,
  LegalConsentsAuditListResponseDTO,
  LegalDocumentVersionResponseDTO,
  RetentionPolicyResponseDTO,
  UserConsentResponseDTO,
} from '../dtos/response';

export function ApiGetPendingConsents() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Documentos legales pendientes de aceptar',
      description:
        'Versiones activas que el usuario autenticado todavía no aceptó.',
    }),
    ApiResponse({
      status: 200,
      type: [LegalDocumentVersionResponseDTO],
    }),
  );
}

export function ApiAcceptConsent() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Aceptar una versión de documento legal',
      description:
        'Crea el registro de aceptación con IP/user-agent capturados server-side.',
    }),
    ApiResponse({
      status: 201,
      type: UserConsentResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Versión inexistente.' }),
    ApiResponse({ status: 409, description: 'Ya aceptada por este usuario.' }),
  );
}

export function ApiGetDataConsentsHistory() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Historial propio de consentimientos',
      description:
        'Aceptaciones de documentos legales + consentimientos de uso de contenido propio.',
    }),
    ApiResponse({ status: 200, type: DataConsentsHistoryResponseDTO }),
  );
}

export function ApiRevokeContentConsent() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Revocar el consentimiento de uso de un contenido propio',
      description:
        'Oculta el contenido a nivel de aplicación, salvo retención legal obligatoria.',
    }),
    ApiResponse({ status: 204, description: 'Revocado.' }),
    ApiResponse({ status: 404, description: 'Sin consentimiento vigente.' }),
    ApiResponse({
      status: 409,
      description: 'LEGAL_HOLD_ACTIVE — retención legal obligatoria.',
    }),
  );
}

export function ApiGetLegalDocumentVersions() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: '[Staff] Listar versiones de documentos legales' }),
    ApiResponse({ status: 200, type: [LegalDocumentVersionResponseDTO] }),
  );
}

export function ApiCreateLegalDocumentVersion() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: '[Staff] Crear versión de documento legal' }),
    ApiResponse({ status: 201, type: LegalDocumentVersionResponseDTO }),
  );
}

export function ApiUpdateLegalDocumentVersion() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: '[Staff] Actualizar versión de documento legal' }),
    ApiResponse({ status: 200, type: LegalDocumentVersionResponseDTO }),
    ApiResponse({ status: 404, description: 'Versión inexistente.' }),
  );
}

export function ApiGetRetentionPolicies() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: '[Staff] Listar políticas de retención' }),
    ApiResponse({ status: 200, type: [RetentionPolicyResponseDTO] }),
  );
}

export function ApiUpsertRetentionPolicy() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: '[Staff] Crear/actualizar política de retención',
      description: 'Upsert por (país, tipo de contenido).',
    }),
    ApiResponse({ status: 200, type: RetentionPolicyResponseDTO }),
  );
}

export function ApiGetLegalConsentsAudit() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: '[Staff] Auditoría de consentimientos',
      description: 'Quién aceptó qué, cuándo, con qué IP — paginado.',
    }),
    ApiResponse({ status: 200, type: LegalConsentsAuditListResponseDTO }),
  );
}
