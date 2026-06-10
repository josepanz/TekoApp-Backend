import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ServiceDetailResponseDTO,
  ServicesListResponseDTO,
  ServiceRequestDetailResponseDTO,
  ServiceRequestsListResponseDTO,
  ServiceStatsResponseDTO,
} from '../dtos/response';

export const CreateServiceDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear un nuevo servicio' }),
    ApiResponse({
      status: 201,
      description: 'Servicio creado exitosamente',
      type: ServiceDetailResponseDTO,
    }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );

export const GetServicesDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener lista de servicios con filtros' }),
    ApiResponse({
      status: 200,
      description: 'Lista de servicios obtenida',
      type: ServicesListResponseDTO,
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );

export const GetNearbyServicesDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener servicios cercanos por ubicación' }),
    ApiResponse({
      status: 200,
      description: 'Servicios cercanos obtenidos',
      type: [ServiceDetailResponseDTO],
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );

export const GetMyServicesDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener servicios del usuario autenticado' }),
    ApiResponse({
      status: 200,
      description: 'Servicios del usuario obtenidos',
      type: [ServiceDetailResponseDTO],
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );

export const GetDashboardStatsDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener estadísticas del dashboard' }),
    ApiResponse({
      status: 200,
      description: 'Estadísticas obtenidas',
      type: ServiceStatsResponseDTO,
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );

export const GetServiceByIdDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener un servicio por ID' }),
    ApiResponse({
      status: 200,
      description: 'Servicio encontrado',
      type: ServiceDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Servicio no encontrado' }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );

export const UpdateServiceDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Actualizar un servicio' }),
    ApiResponse({
      status: 200,
      description: 'Servicio actualizado',
      type: ServiceDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Servicio no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'No autorizado para modificar este servicio',
    }),
  );

export const CancelServiceDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Cancelar un servicio' }),
    ApiResponse({
      status: 200,
      description: 'Servicio cancelado',
      type: ServiceDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Servicio no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'No autorizado para cancelar este servicio',
    }),
  );

export const AcceptServiceDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Aceptar un servicio (solo profesionales)' }),
    ApiResponse({
      status: 200,
      description: 'Servicio aceptado',
      type: ServiceDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Servicio no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'No autorizado o no es profesional',
    }),
  );

export const StartServiceDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Iniciar un servicio (solo profesionales)' }),
    ApiResponse({
      status: 200,
      description: 'Servicio iniciado',
      type: ServiceDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Servicio no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'No autorizado o no es profesional',
    }),
  );

export const CompleteServiceDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Completar un servicio (solo profesionales)' }),
    ApiResponse({
      status: 200,
      description: 'Servicio completado',
      type: ServiceDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Servicio no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'No autorizado o no es profesional',
    }),
  );

export const CreateServiceRequestDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Crear una solicitud para un servicio (solo profesionales)',
    }),
    ApiResponse({
      status: 201,
      description: 'Solicitud creada',
      type: ServiceRequestDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Servicio no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'No autorizado o no es profesional',
    }),
  );

export const GetServiceRequestsDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener solicitudes de un servicio' }),
    ApiResponse({
      status: 200,
      description: 'Solicitudes obtenidas',
      type: ServiceRequestsListResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Servicio no encontrado' }),
  );

export const RespondToServiceRequestDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Responder a una solicitud de servicio' }),
    ApiResponse({
      status: 200,
      description: 'Solicitud respondida',
      type: ServiceRequestDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Solicitud no encontrada' }),
    ApiResponse({
      status: 403,
      description: 'No autorizado para responder esta solicitud',
    }),
  );
