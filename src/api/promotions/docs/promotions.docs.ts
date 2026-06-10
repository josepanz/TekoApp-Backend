import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  PromotionDetailResponseDTO,
  PromotionApplyResponseDTO,
  PromotionValidateResponseDTO,
  PromotionStatsResponseDTO,
} from '../dtos/response';

export const ApiCreatePromotion = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Crear una nueva promoción' }),
    ApiResponse({
      status: 201,
      description: 'Promoción creada exitosamente',
      type: PromotionDetailResponseDTO,
    }),
    ApiResponse({
      status: 400,
      description: 'El código de promoción ya existe',
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );

export const ApiGetPromotions = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener todas las promociones' }),
    ApiResponse({
      status: 200,
      description: 'Lista de promociones',
      type: [PromotionDetailResponseDTO],
    }),
  );

export const ApiGetActivePromotions = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener promociones activas y vigentes' }),
    ApiResponse({
      status: 200,
      description: 'Lista de promociones activas',
      type: [PromotionDetailResponseDTO],
    }),
  );

export const ApiGetPromotionStats = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Obtener estadísticas de uso de promociones' }),
    ApiResponse({
      status: 200,
      description: 'Estadísticas obtenidas',
      type: PromotionStatsResponseDTO,
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );

export const ApiGetPromotionById = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener una promoción por ID' }),
    ApiResponse({
      status: 200,
      description: 'Promoción encontrada',
      type: PromotionDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Promoción no encontrada' }),
  );

export const ApiUpdatePromotion = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Actualizar una promoción existente' }),
    ApiResponse({
      status: 200,
      description: 'Promoción actualizada',
      type: PromotionDetailResponseDTO,
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 404, description: 'Promoción no encontrada' }),
  );

export const ApiDeletePromotion = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Desactivar una promoción (soft delete)' }),
    ApiResponse({
      status: 200,
      description: 'Promoción desactivada',
      type: PromotionDetailResponseDTO,
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 404, description: 'Promoción no encontrada' }),
  );

export const ApiValidatePromotion = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Validar un código de promoción sin aplicarlo' }),
    ApiResponse({
      status: 200,
      description: 'Resultado de validación',
      type: PromotionValidateResponseDTO,
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );

export const ApiApplyPromotion = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Aplicar una promoción y registrar su uso' }),
    ApiResponse({
      status: 200,
      description: 'Resultado de la aplicación',
      type: PromotionApplyResponseDTO,
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
