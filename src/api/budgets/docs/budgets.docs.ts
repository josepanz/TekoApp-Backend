import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  BudgetOptionResponseDTO,
  BudgetOptionsListResponseDTO,
} from '../dtos/response';

export function ApiReplaceBudgetOptions() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Reemplazar el set de opciones de presupuesto de una propuesta',
      description:
        'Solo el profesional autor, mientras la solicitud sigue pendiente. totalPrice/subtotal se recalculan server-side.',
    }),
    ApiResponse({ status: 200, type: BudgetOptionsListResponseDTO }),
    ApiResponse({
      status: 400,
      description:
        'Máximo de opciones excedido o ítem de catálogo inexistente.',
    }),
    ApiResponse({
      status: 403,
      description: 'No es el autor de la propuesta.',
    }),
  );
}

export function ApiGetBudgetOptions() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Listar las opciones de presupuesto de una propuesta',
      description:
        'Cliente dueño del servicio o profesional autor de la propuesta.',
    }),
    ApiResponse({ status: 200, type: BudgetOptionsListResponseDTO }),
  );
}

export function ApiSelectBudgetOption() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Elegir una opción de presupuesto',
      description:
        'Acepta la propuesta con esa opción — mismo efecto que aceptar una ServiceRequests (competidoras auto-rechazadas).',
    }),
    ApiResponse({ status: 200, type: BudgetOptionResponseDTO }),
    ApiResponse({
      status: 409,
      description: 'El servicio ya no acepta propuestas.',
    }),
  );
}
