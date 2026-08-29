import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  AdminProfessionalDocumentsListResponseDTO,
  MyDocumentsListResponseDTO,
  ProfessionalDocumentResponseDTO,
  ProfessionalDocumentsListResponseDTO,
} from '../dtos/response';

export function ApiUploadProfessionalDocument() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiConsumes('multipart/form-data'),
    ApiOperation({
      summary: 'Cargar un documento de habilitación/antecedente',
    }),
    ApiResponse({ status: 201, type: ProfessionalDocumentResponseDTO }),
    ApiResponse({
      status: 403,
      description: 'Falta consentimiento vigente (CONSENT_REQUIRED).',
    }),
    ApiResponse({
      status: 404,
      description: 'El tipo de documento no existe o no aplica a tu categoría.',
    }),
  );
}

export function ApiGetMyProfessionalDocuments() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Estado de mis documentos',
      description:
        'Cada tipo aplicable a mi categoría, con mi documento más reciente si existe.',
    }),
    ApiResponse({ status: 200, type: MyDocumentsListResponseDTO }),
  );
}

export function ApiGetPublicProfessionalDocuments() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Documentos aprobados y visibles de un profesional (perfil público)',
    }),
    ApiResponse({ status: 200, type: ProfessionalDocumentsListResponseDTO }),
  );
}

export function ApiGetAdminProfessionalDocumentsQueue() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Cola de revisión — todos los profesionales, paginada',
      description: 'Filtrable por status/category. Ver openspec/decisions.md.',
    }),
    ApiResponse({
      status: 200,
      type: AdminProfessionalDocumentsListResponseDTO,
    }),
  );
}

export function ApiGetAdminProfessionalDocuments() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Todos los documentos de un profesional (staff)' }),
    ApiResponse({ status: 200, type: ProfessionalDocumentsListResponseDTO }),
  );
}

export function ApiReviewProfessionalDocument() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Aprobar o rechazar un documento (staff)' }),
    ApiResponse({ status: 200, type: ProfessionalDocumentResponseDTO }),
    ApiResponse({ status: 404, description: 'Documento inexistente.' }),
    ApiResponse({ status: 409, description: 'El documento ya fue revisado.' }),
  );
}
