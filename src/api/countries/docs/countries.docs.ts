import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  CountryResponseDTO,
  GetCountriesListResponseDTO,
} from '../dtos/response';

export function ApiGetCountriesList() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar países',
      description:
        'Retorna el catálogo paginado de países activos. Admite búsqueda por nombre o código ISO.',
    }),
    ApiResponse({
      status: 200,
      description: 'Listado paginado de países.',
      type: GetCountriesListResponseDTO,
    }),
  );
}

export function ApiGetCountryById() {
  return applyDecorators(
    ApiParam({ name: 'id', description: 'ID del país', example: 1 }),
    ApiOperation({
      summary: 'Obtener país por ID',
      description: 'Retorna el detalle de un país por su identificador.',
    }),
    ApiResponse({
      status: 200,
      description: 'Detalle del país.',
      type: CountryResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'País no encontrado.' }),
  );
}
