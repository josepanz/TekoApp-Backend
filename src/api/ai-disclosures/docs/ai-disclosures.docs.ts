import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AiDisclosureResponseDTO,
  AiDisclosuresAdminListResponseDTO,
} from '../dtos/response';

export function ApiDeclareAiDisclosure() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Declarar contenido propio como asistido por IA',
      description: 'Upsert por (entityType, entityReferenceId) — idempotente.',
    }),
    ApiResponse({ status: 200, type: AiDisclosureResponseDTO }),
    ApiResponse({
      status: 400,
      description: 'entityType no admite autodeclaración.',
    }),
    ApiResponse({ status: 403, description: 'No sos el dueño del contenido.' }),
    ApiResponse({ status: 404, description: 'Contenido inexistente.' }),
  );
}

export function ApiRetractAiDisclosure() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Retirar la propia autodeclaración de IA' }),
    ApiResponse({ status: 204, description: 'Retirada.' }),
    ApiResponse({
      status: 403,
      description: 'No sos el dueño de la declaración.',
    }),
    ApiResponse({ status: 404, description: 'Sin declaración vigente.' }),
  );
}

export function ApiGetAiDisclosure() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Consultar el disclosure de IA de un contenido puntual',
      description: 'Devuelve null si el contenido no tiene disclosure.',
    }),
    ApiResponse({ status: 200, type: AiDisclosureResponseDTO }),
  );
}

export function ApiGetAiDisclosuresAdmin() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: '[Staff] Listado agregado de disclosures de IA',
      description: 'Paginado, filtrable por entityType/source.',
    }),
    ApiResponse({ status: 200, type: AiDisclosuresAdminListResponseDTO }),
  );
}
