import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ServiceProgressEntryResponseDTO,
  ServiceProgressListResponseDTO,
} from '../dtos/response';

export function ApiCreateServiceProgressEntry() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Agregar una entrada de bitácora de avance',
      description:
        'Solo el profesional asignado, y solo mientras el servicio está ACCEPTED/IN_PROGRESS.',
    }),
    ApiResponse({ status: 201, type: ServiceProgressEntryResponseDTO }),
    ApiResponse({
      status: 400,
      description: 'Falta nota/foto obligatoria, o excede el máximo de fotos.',
    }),
    ApiResponse({
      status: 403,
      description: 'No sos el profesional asignado.',
    }),
    ApiResponse({
      status: 404,
      description: 'Servicio inexistente.',
    }),
    ApiResponse({
      status: 409,
      description: 'El servicio no está ACCEPTED/IN_PROGRESS.',
    }),
  );
}

export function ApiGetServiceProgress() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Listar la bitácora de un servicio',
      description:
        'Cliente dueño, profesional asignado, o staff con permiso de auditoría.',
    }),
    ApiResponse({ status: 200, type: ServiceProgressListResponseDTO }),
    ApiResponse({
      status: 403,
      description: 'Sin permiso para ver esta bitácora.',
    }),
    ApiResponse({ status: 404, description: 'Servicio inexistente.' }),
  );
}

export function ApiDeleteServiceProgressEntry() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Eliminar (soft-delete) una entrada propia dentro de la ventana de corrección',
    }),
    ApiResponse({ status: 204, description: 'Eliminada.' }),
    ApiResponse({
      status: 403,
      description: 'No sos el autor de la entrada.',
    }),
    ApiResponse({ status: 404, description: 'Entrada inexistente.' }),
    ApiResponse({
      status: 409,
      description: 'Venció la ventana de corrección.',
    }),
  );
}
