import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LanguageResponseDTO } from '../dtos/response';

export function ApiGetLanguagesList() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar idiomas',
      description: 'Retorna el catálogo completo de idiomas activos.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de idiomas activos.',
      type: [LanguageResponseDTO],
    }),
  );
}

export function ApiGetLanguageById() {
  return applyDecorators(
    ApiParam({ name: 'id', description: 'ID del idioma', example: 1 }),
    ApiOperation({
      summary: 'Obtener idioma por ID',
      description: 'Retorna el detalle de un idioma por su identificador.',
    }),
    ApiResponse({
      status: 200,
      description: 'Detalle del idioma.',
      type: LanguageResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Idioma no encontrado.' }),
  );
}
