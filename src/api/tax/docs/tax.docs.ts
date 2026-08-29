import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TaxConfigResponseDTO } from '../dtos/response';

export const GetTaxConfigDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener la configuración activa de impuestos (IVA) por país',
      description:
        'Paraguay-only por ahora — siempre resuelve el default global (sin país por Service/' +
        'User todavía). Nunca falla: si no hay ninguna config cargada, devuelve un default ' +
        'seguro y deshabilitado (`isEnabled: false`, `rate: 0`) hasta contar con asesoría ' +
        'fiscal real.',
    }),
    ApiResponse({ status: 200, type: TaxConfigResponseDTO }),
  );
