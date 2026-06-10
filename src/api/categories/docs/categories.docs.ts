import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  CategoryDetailResponseDTO,
  CategoryStatsResponseDTO,
} from '../dtos/response';

export function ApiCreateCategory() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Crear nueva categoría',
      description: 'Crea una nueva categoría de servicios profesionales.',
    }),
    ApiResponse({
      status: 201,
      description: 'Categoría creada exitosamente.',
      type: CategoryDetailResponseDTO,
    }),
    ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' }),
    ApiResponse({
      status: 409,
      description: 'Ya existe una categoría con este nombre.',
    }),
  );
}

export function ApiGetAllCategories() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener todas las categorías',
      description: 'Retorna todas las categorías activas y visibles.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de categorías activas.',
      type: [CategoryDetailResponseDTO],
    }),
  );
}

export function ApiGetAllCategoriesWithRelations() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Obtener todas las categorías (incluyendo inactivas)',
      description:
        'Retorna todo el árbol de categorías para panel de administración.',
    }),
    ApiResponse({
      status: 200,
      description: 'Árbol completo de categorías.',
      type: [CategoryDetailResponseDTO],
    }),
  );
}

export function ApiGetMainCategories() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener categorías principales',
      description: 'Retorna raíz de categorías (Filtra las subcategorías).',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de categorías raíz.',
      type: [CategoryDetailResponseDTO],
    }),
  );
}

export function ApiGetSubcategories() {
  return applyDecorators(
    ApiParam({
      name: 'parentId',
      description: 'ID de la categoría padre',
      type: Number,
    }),
    ApiOperation({
      summary: 'Obtener subcategorías',
      description: 'Retorna las subcategorías hijas de una categoría raíz.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de subcategorías.',
      type: [CategoryDetailResponseDTO],
    }),
    ApiResponse({ status: 404, description: 'Categoría padre no encontrada.' }),
  );
}

export function ApiSearchCategories() {
  return applyDecorators(
    ApiOperation({
      summary: 'Buscar categorías',
      description: 'Busca coincidencias por nombre o descripciones indexadas.',
    }),
    ApiResponse({
      status: 200,
      description: 'Resultados de búsqueda.',
      type: [CategoryDetailResponseDTO],
    }),
  );
}

export function ApiGetCategoryById() {
  return applyDecorators(
    ApiParam({ name: 'id', description: 'ID de la categoría', type: Number }),
    ApiOperation({
      summary: 'Obtener categoría por ID',
      description: 'Busca de forma exacta un registro por ID.',
    }),
    ApiResponse({
      status: 200,
      description: 'Categoría encontrada.',
      type: CategoryDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Categoría no encontrada.' }),
  );
}

export function ApiGetCategoryBySlug() {
  return applyDecorators(
    ApiParam({
      name: 'slug',
      description: 'Slug único estructurado url-ready',
    }),
    ApiOperation({ summary: 'Obtener categoría por slug' }),
    ApiResponse({
      status: 200,
      description: 'Categoría encontrada.',
      type: CategoryDetailResponseDTO,
    }),
    ApiResponse({
      status: 404,
      description: 'Categoría no encontrada por el slug provisto.',
    }),
  );
}

export function ApiGetCategoryStats() {
  return applyDecorators(
    ApiParam({ name: 'id', description: 'ID de la categoría', type: Number }),
    ApiOperation({ summary: 'Obtener métricas y contadores de la categoría' }),
    ApiResponse({
      status: 200,
      description: 'Estadísticas de la categoría.',
      type: CategoryStatsResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Categoría no encontrada.' }),
  );
}

export function ApiUpdateCategory() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiParam({ name: 'id', description: 'ID de la categoría', type: Number }),
    ApiOperation({ summary: 'Actualizar categoría de forma parcial' }),
    ApiResponse({
      status: 200,
      description: 'Categoría actualizada.',
      type: CategoryDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Categoría no encontrada.' }),
    ApiResponse({
      status: 409,
      description: 'Ya existe otra categoría con este nombre.',
    }),
  );
}

export function ApiChangeCategoryStatus() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiParam({ name: 'id', description: 'ID de la categoría', type: Number }),
    ApiOperation({ summary: 'Mutar estado transaccional de una categoría' }),
    ApiResponse({
      status: 200,
      description: 'Estado actualizado.',
      type: CategoryDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Categoría no encontrada.' }),
  );
}

export function ApiToggleCategoryVisibility() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiParam({ name: 'id', description: 'ID de la categoría', type: Number }),
    ApiOperation({ summary: 'Invertir bandera de visibilidad pública' }),
    ApiResponse({
      status: 200,
      description: 'Visibilidad actualizada.',
      type: CategoryDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Categoría no encontrada.' }),
  );
}

export function ApiDeleteCategory() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiParam({ name: 'id', description: 'ID de la categoría', type: Number }),
    ApiOperation({ summary: 'Eliminar físicamente una categoría' }),
    ApiResponse({ status: 204, description: 'Categoría eliminada.' }),
    ApiResponse({
      status: 400,
      description: 'No se puede eliminar: tiene dependencias activas.',
    }),
    ApiResponse({ status: 404, description: 'Categoría no encontrada.' }),
  );
}
