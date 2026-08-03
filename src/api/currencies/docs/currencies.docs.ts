import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CurrencyResponseDTO } from '../dtos/response';

export function ApiGetCurrenciesList() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar monedas',
      description:
        'Retorna el catálogo completo de monedas activas (ISO 4217).',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de monedas activas.',
      type: [CurrencyResponseDTO],
    }),
  );
}

export function ApiGetCurrencyByCode() {
  return applyDecorators(
    ApiParam({
      name: 'alphaCode',
      description: 'Código alfabético ISO 4217',
      example: 'PYG',
    }),
    ApiOperation({
      summary: 'Obtener moneda por código',
      description: 'Retorna el detalle de una moneda por su código alfabético.',
    }),
    ApiResponse({
      status: 200,
      description: 'Detalle de la moneda.',
      type: CurrencyResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Moneda no encontrada.' }),
  );
}
