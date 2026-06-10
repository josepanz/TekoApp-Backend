import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  RatingDetailResponseDTO,
  RatingsListResponseDTO,
  ProfessionalRatingStatsResponseDTO,
  UserRatingStatsResponseDTO,
  TopRatedProfessionalResponseDTO,
} from '../dtos/response';

export const CreateRatingDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear una nueva calificación' }),
    ApiResponse({
      status: 201,
      description: 'Calificación creada exitosamente',
      type: RatingDetailResponseDTO,
    }),
    ApiResponse({
      status: 400,
      description: 'Datos inválidos o calificación duplicada',
    }),
  );

export const FindAllRatingsDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener todas las calificaciones' }),
    ApiResponse({
      status: 200,
      description: 'Lista de calificaciones obtenida exitosamente',
      type: RatingsListResponseDTO,
    }),
  );

export const GetRecentRatingsDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener calificaciones recientes' }),
    ApiResponse({
      status: 200,
      description: 'Calificaciones recientes obtenidas exitosamente',
      type: RatingsListResponseDTO,
    }),
  );

export const GetTopRatedProfessionalsDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener profesionales mejor calificados' }),
    ApiResponse({
      status: 200,
      description: 'Lista de profesionales mejor calificados',
      type: [TopRatedProfessionalResponseDTO],
    }),
  );

export const FindByUserDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener calificaciones de un usuario' }),
    ApiResponse({
      status: 200,
      description: 'Calificaciones del usuario obtenidas exitosamente',
      type: RatingsListResponseDTO,
    }),
  );

export const GetUserRatingStatsDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener estadísticas de calificaciones de un usuario',
    }),
    ApiResponse({
      status: 200,
      description: 'Estadísticas del usuario obtenidas exitosamente',
      type: UserRatingStatsResponseDTO,
    }),
  );

export const FindByProfessionalDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener calificaciones de un profesional' }),
    ApiResponse({
      status: 200,
      description: 'Calificaciones del profesional obtenidas exitosamente',
      type: RatingsListResponseDTO,
    }),
  );

export const GetClientRatingsDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener calificaciones de clientes a un profesional',
    }),
    ApiResponse({
      status: 200,
      description: 'Calificaciones de clientes obtenidas exitosamente',
      type: RatingsListResponseDTO,
    }),
  );

export const GetAverageRatingDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener calificación promedio de un profesional',
    }),
    ApiResponse({
      status: 200,
      description: 'Estadísticas de calificaciones obtenidas',
      type: ProfessionalRatingStatsResponseDTO,
    }),
  );

export const FindByServiceRequestDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener calificaciones de una solicitud de servicio',
    }),
    ApiResponse({
      status: 200,
      description: 'Calificaciones de la solicitud obtenidas exitosamente',
      type: RatingsListResponseDTO,
    }),
  );

export const FindOneRatingDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener una calificación específica' }),
    ApiResponse({
      status: 200,
      description: 'Calificación encontrada exitosamente',
      type: RatingDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Calificación no encontrada' }),
  );

export const UpdateRatingDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Actualizar una calificación' }),
    ApiResponse({
      status: 200,
      description: 'Calificación actualizada exitosamente',
      type: RatingDetailResponseDTO,
    }),
    ApiResponse({
      status: 400,
      description: 'No se puede editar la calificación después de 24 horas',
    }),
    ApiResponse({
      status: 403,
      description: 'No tienes permisos para editar esta calificación',
    }),
  );

export const RemoveRatingDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar una calificación' }),
    ApiResponse({
      status: 204,
      description: 'Calificación eliminada exitosamente',
    }),
    ApiResponse({
      status: 403,
      description: 'No tienes permisos para eliminar esta calificación',
    }),
  );

export const ReportRatingDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Reportar una calificación' }),
    ApiResponse({
      status: 200,
      description: 'Calificación reportada exitosamente',
      type: RatingDetailResponseDTO,
    }),
    ApiResponse({
      status: 400,
      description: 'No puedes reportar tu propia calificación',
    }),
  );
