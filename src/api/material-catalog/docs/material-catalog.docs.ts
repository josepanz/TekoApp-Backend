import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  MaterialCatalogItemResponseDTO,
  MaterialCatalogListResponseDTO,
} from '../dtos/response';

export function ApiGetMaterialCatalog() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Catálogo de materiales/calidades para presupuestos',
      description:
        'Filtrable por categoría/país/calidad — paginado. Precios sugeridos, no regulados.',
    }),
    ApiResponse({ status: 200, type: MaterialCatalogListResponseDTO }),
  );
}

export function ApiCreateMaterialCatalogItem() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: '[Staff] Crear un ítem de catálogo' }),
    ApiResponse({ status: 201, type: MaterialCatalogItemResponseDTO }),
  );
}

export function ApiUpdateMaterialCatalogItem() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: '[Staff] Editar un ítem de catálogo' }),
    ApiResponse({ status: 200, type: MaterialCatalogItemResponseDTO }),
    ApiResponse({ status: 404, description: 'Ítem inexistente.' }),
  );
}
