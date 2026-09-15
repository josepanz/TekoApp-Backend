import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditLogsListResponseDTO } from '../dtos/response';

export function ApiGetAuditLogs() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Listado de auditoría del sistema (staff)',
      description:
        'Historial de cambios registrado por los triggers de auditoría de la base de datos.',
    }),
    ApiResponse({ status: 200, type: AuditLogsListResponseDTO }),
  );
}
