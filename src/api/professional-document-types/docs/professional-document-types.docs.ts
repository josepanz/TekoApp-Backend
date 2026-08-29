import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ProfessionalDocumentTypeResponseDTO,
  ProfessionalDocumentTypesListResponseDTO,
} from '../dtos/response';

export function ApiGetProfessionalDocumentTypes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Catálogo de tipos de documento profesional',
      description:
        'Antecedentes, certificados, portafolio — filtrable por país/categoría de servicio.',
    }),
    ApiResponse({
      status: 200,
      type: ProfessionalDocumentTypesListResponseDTO,
    }),
  );
}

export function ApiCreateProfessionalDocumentType() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Crear un tipo de documento profesional (staff)' }),
    ApiResponse({ status: 201, type: ProfessionalDocumentTypeResponseDTO }),
  );
}

export function ApiUpdateProfessionalDocumentType() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Editar un tipo de documento profesional (staff)',
    }),
    ApiResponse({ status: 200, type: ProfessionalDocumentTypeResponseDTO }),
    ApiResponse({ status: 404, description: 'Tipo inexistente.' }),
  );
}
