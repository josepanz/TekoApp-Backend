import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TipConfigResponseDTO, TipResponseDTO } from '../dtos/response';

export const GetTipConfigDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener la configuración activa de propinas',
      description:
        'Paraguay-only por ahora — siempre resuelve el default global (sin país por Service/' +
        'User todavía). Nunca falla: si no hay ninguna config cargada, devuelve un default ' +
        'seguro (habilitadas, opcionales, sugeridas 10/15/20%).',
    }),
    ApiResponse({ status: 200, type: TipConfigResponseDTO }),
  );

export const CreateTipDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Dejar una propina para un pago ya resuelto',
      description:
        'Solo el cliente dueño del pago, una vez (`payment_id` es único en `tips`), y solo si ' +
        'el pago está PAID/COMPLETED. La propina nunca se fusiona a `Payment.totalAmount` ni ' +
        'entra en el cálculo de comisión de la plataforma — es 100% para el profesional.',
    }),
    ApiResponse({ status: 201, type: TipResponseDTO }),
    ApiResponse({
      status: 400,
      description: 'Pago no elegible o ya tiene propina',
    }),
    ApiResponse({
      status: 403,
      description: 'No sos el cliente dueño del pago',
    }),
    ApiResponse({ status: 404, description: 'Pago no encontrado' }),
  );

export const GetTipDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener la propina de un pago (si existe)' }),
    ApiResponse({ status: 200, type: TipResponseDTO }),
    ApiResponse({ status: 404, description: 'Pago no encontrado' }),
  );
